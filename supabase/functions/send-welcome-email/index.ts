import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Loading send-welcome-email function...")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user ID from the request body
    const { userId } = await req.json()
    console.log("Received request to send welcome email for user:", userId)

    // Get the user's email from the database
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (userError || !userData?.email) {
      console.error("Error fetching user data:", userError)
      throw new Error('User not found')
    }

    console.log("Sending welcome email to:", userData.email)

    // Send the welcome email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: userData.email,
        subject: 'Welcome to Our Chat App!',
        html: `
          <h1>Welcome to Our Chat App!</h1>
          <p>We're excited to have you join our community. Get started by:</p>
          <ul>
            <li>Joining a chat room</li>
            <li>Creating your own room</li>
            <li>Meeting new people</li>
          </ul>
          <p>If you have any questions, feel free to reach out!</p>
        `,
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      console.error("Error sending welcome email:", error)
      throw new Error(`Failed to send email: ${JSON.stringify(error)}`)
    }

    console.log("Welcome email sent successfully!")
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Error in send-welcome-email function:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})