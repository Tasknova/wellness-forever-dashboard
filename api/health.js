export default async function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'wf-intelligence-agent',
    apiBase: '/api',
    groqConfigured: Boolean(process.env.GROQ_API_KEY)
  });
}