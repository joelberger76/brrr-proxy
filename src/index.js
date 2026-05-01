export default {
   async fetch(request, env, ctx) {

      // Rate Limit
      const { hostname } = new URL(request.url);

      const { success } = await env.BRRR_PROXY_RATE_LIMITER.limit({ key: hostname });
      if (!success) {
         return new Response(`Rate limit exceeded for ${hostname}`, { status: 429 })
      }

      // Limit to POST requests
      if (request.method !== 'POST') {
         // "Security" through obscurity
         return new Response('Not Found', { status: 404 });
      }

      try {
         // Parse incoming Cronitor payload
         const cronitorPayload = await request.json();

      	// Validate required fields for message construction
         if (!cronitorPayload.monitor || !cronitorPayload.description) {
         	// "Security" through obscurity
         	return new Response('Not Found', { status: 404 });
         }

         // Construct message body
         const status = cronitorPayload.type == "Recovery" ? "🟢 [Resolved]" : "🔴 [Open]";
         const message = status + " " + cronitorPayload.monitor + "\n\n" + cronitorPayload.description;

         // Transform to your desired format
         const customPayload = {
            "title": "Cronitor",
            "message": message,
            "thread_id": env.BRRR_GROUPING,
            "sound": env.BRRR_SOUND,
            "image_url": env.IMAGE_URL
         };

         // Forward to your final destination
         const response = await fetch(env.BRRR_URL, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               "Authorization": "Bearer " + env.BRRR_JOELS_IPHONE
            },
            body: JSON.stringify(customPayload)
         });

         return new Response('OK', { status: 200 });
      } catch (error) {
         return new Response(`Error: ${error.message}`, { status: 500 });
      }
   }
};
