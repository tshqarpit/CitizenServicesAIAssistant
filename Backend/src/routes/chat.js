const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const supabase = require('../config/supabase');
const ai = require('../config/gemini');

router.use(authenticateToken);

/**
 * POST /api/chat
 * Handles user queries, searches services, returns Gemini response.
 */
router.post('/', async (req, res) => {
  let { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: 'Message is too long' });
  }

  // Sanitize input
  message = message.replace(/<[^>]*>/g, '');

  // Extract keywords for simple full‑text search
  const keywords = message
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);

  try {
    let data = [];
    
    // Only search Supabase if we have valid keywords (avoids errors on messages like "hi")
    if (keywords.length > 0) {
      const orQuery = keywords
        .map(
          kw => `keywords.ilike.%${kw}%,service_name.ilike.%${kw}%,full_guide_text.ilike.%${kw}%,eligibility.ilike.%${kw}%,required_documents.ilike.%${kw}%`
        )
        .join(',');
        
      const { data: searchData, error } = await supabase
        .from('citizen_services_v1')
        .select('*')
        .or(orQuery)
        .limit(3);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error('Database query failed');
      }

      if (searchData && searchData.length > 0) {
        data = searchData;
      }
    }

    // Build context for Gemini
    let databaseContext = '';
    if (data.length === 0) {
      const { data: allServices } = await supabase
        .from('citizen_services_v1')
        .select('service_name')
        .limit(10);
      const serviceNames =
        allServices && allServices.length > 0
          ? allServices.map(s => s.service_name).join(', ')
          : 'Various citizen and government services';
      databaseContext = `No specific service matched the query.\nYou are the Citizen Services AI Portal Assistant. Available services include: ${serviceNames}.`;
    } else {
      databaseContext = data
        .map(
          (svc, i) => `Service ${i + 1}:\nService Name: ${svc.service_name || 'N/A'}\nDepartment: ${svc.department_name || 'N/A'}\nEligibility: ${svc.eligibility || 'N/A'}\nRequired Documents: ${svc.required_documents || 'N/A'}\nGuide: ${svc.full_guide_text || 'N/A'}\nOfficial Link: ${svc.official_link || 'N/A'}\n`
        )
        .join('\n');
    }

    const systemInstruction = `You are an official Citizen Services AI Portal Assistant.\n\nYour responsibility is to provide accurate, clear, and helpful citizen guidance.\n\nSTRICT RULES:\n1. Use ONLY the verified database context below when answering about a specific service.\n2. Never invent procedures, eligibility, or documents.\n3. If the user asks about a service not present in the context, politely state that the information is unavailable.\n4. For general platform questions, explain your role and list available services from the context.\n5. Keep responses concise and friendly.\n\nPlatform Knowledge (always available):\n- UPCOP App Android: https://play.google.com/store/apps/details?id=uttarpradesh.citizen.app\n- UPCOP App iOS: https://apps.apple.com/in/app/upcop/id6455495788\n- UP Citizen Portal: https://cctnsup.gov.in/citizenportal/login.aspx\n\nVerified Database Context:\n${databaseContext}`;

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        temperature: 0.3,
        maxOutputTokens: 700,
        systemInstruction,
      },
    });

    res.json({ reply: geminiResponse.text });
  } catch (err) {
    console.error('Chat Error:', err);
    if (err.message && err.message.includes('429')) {
      return res.status(429).json({ error: 'The AI assistant is currently experiencing high traffic or has reached its quota limit. Please try again in a few moments.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/chat/suggestions
 * Returns up to 5 AI‑generated suggestion prompts based on random services.
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { data: services, error } = await supabase
      .from('citizen_services_v1')
      .select('service_name')
      .limit(20);
      
    if (error) throw error;
    
    // Shuffle the services in JavaScript to avoid Supabase random() errors
    const shuffled = (services || []).sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    
    const suggestions = selected.map(s => `How can I apply for ${s.service_name.toLowerCase()}?`);
    res.json({ suggestions });
  } catch (e) {
    console.error('Suggestions error:', e);
    res.status(500).json({ suggestions: [], error: 'Failed to generate suggestions' });
  }
});

module.exports = router;
