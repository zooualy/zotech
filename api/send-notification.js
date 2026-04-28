const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { titre, corps, lien, segments, externalUserIds } = await req.json()
    
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')

    const body = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: titre || 'ZoTech', fr: titre || 'ZoTech' },
      contents: { en: corps || 'Nouvelle notification', fr: corps || 'Nouvelle notification' },
      url: lien || 'https://www.zotech.technology'
    }

    // Si segments → envoyer à un groupe (ex: tous les abonnés)
    if (segments && segments.length > 0) {
      body.included_segments = segments
    }
    // Sinon envoyer à des utilisateurs spécifiques par leur external_id
    else if (externalUserIds && externalUserIds.length > 0) {
      body.include_aliases = { external_id: externalUserIds }
      body.target_channel = 'push'
    }

    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const result = await response.json()
    console.log('OneSignal result:', JSON.stringify(result))

    return new Response(JSON.stringify(result), { 
      status: 200, headers: corsHeaders 
    })

  } catch (error) {
    console.error('Erreur:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: corsHeaders 
    })
  }
})