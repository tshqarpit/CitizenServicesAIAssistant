const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const supabase = require('../config/supabase');
const ai = require('../config/gemini');

router.use(authenticateToken);

router.post('/', async (req, res) => {
  let { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (message.length > 1000) {
      return res.status(400).json({ error: 'Message is too long' });
  }

  // Step 2: Sanitize User Input (basic)
  message = message.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
  
  // Step 3: Extract Search Keywords
  const keywords = message
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);

  if (keywords.length === 0) {
      return res.status(400).json({ error: 'Please provide more details.' });
  }

  try {
    // Step 4: Query Supabase
    let data = [];
    
    // Create an OR query that checks all text columns for each word
    const orQuery = keywords.map(kw => 
      `keywords.ilike.%${kw}%,service_name.ilike.%${kw}%,full_guide_text.ilike.%${kw}%,eligibility.ilike.%${kw}%,required_documents.ilike.%${kw}%`
    ).join(',');
    
    const { data: searchData, error } = await supabase
      .from('citizen_services_v1')
      .select('*')
      .or(orQuery)
      .limit(3);

    if (error) {
        console.error("Supabase error:", error);
        throw new Error('Database query failed');
    }
    
    if (searchData && searchData.length > 0) {
        data = searchData;
    }

    let databaseContext = "";

    if (data.length === 0) {
      // If no specific match, fetch a few services to give Gemini examples of what's available
      const { data: allServices } = await supabase
        .from('citizen_services_v1')
        .select('service_name')
        .limit(10);
        
      const serviceNames = allServices && allServices.length > 0 
        ? allServices.map(s => s.service_name).join(', ') 
        : 'Various citizen and government services';

      databaseContext = `No specific service workflow information matched the user's query.
However, you are the Citizen Services AI Portal Assistant. You provide guidance on government services.
Examples of services you can help with include: ${serviceNames}.
If the user asks a general question about the platform or what you do, explain your purpose and list some of these available services.
If they are asking for a specific service that is not found, politely inform them that official workflow information for that specific service is currently unavailable in the verified database, and suggest they visit the official department website or contact the department helpdesk.`;
    } else {
      databaseContext = data.map((service, index) => `Service ${index + 1}:
Service Name: ${service.service_name || 'N/A'}
Department: ${service.department_name || 'N/A'}
Eligibility: ${service.eligibility || 'N/A'}
Required Documents: ${service.required_documents || 'N/A'}
Guide: ${service.full_guide_text || 'N/A'}
Official Link: ${service.official_link || 'N/A'}
`).join('\n\n');
    }

    // Step 7: Google Gemini Integration
    const systemInstruction = `You are an official Citizen Services AI Portal Assistant.

Your responsibility is to provide accurate, clear, and helpful citizen guidance.

STRICT RULES:
1. When answering about a specific service, use ONLY the verified database context provided below.
2. Never invent government rules, procedures, required documents, or eligibility criteria.
3. If the user asks about a service not in the database context, politely state that the information is unavailable.
4. If the user asks general questions about this platform or what services are provided, explain your role as an AI assistant and list the examples of available services from the context.
5. Keep responses concise, structured, and friendly.
6. Prefer numbered steps for processes.

Platform Knowledge (Always Available):
- UPCOP App Android Download: https://play.google.com/store/apps/details?id=uttarpradesh.citizen.app
- UPCOP App iOS Download: https://apps.apple.com/in/app/upcop/id6455495788
- UP Citizen Portal: https://cctnsup.gov.in/citizenportal/login.aspx

Verified Database Context:
${databaseContext}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
            temperature: 0.3,
            maxOutputTokens: 700,
            systemInstruction: systemInstruction,
        }
    });

    const replyText = response.text;
    res.json({ reply: replyText });

  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
