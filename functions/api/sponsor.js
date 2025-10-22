export async function onRequestPost(context) {
  try {
    const { name, company, email, phone, notes } = await context.request.json();

    // Validate required fields
    if (!name || !company || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Send email notification via Resend
    const emailBody = `
  New Sponsorship Inquiry
  
  Name: ${name}
  Company: ${company}
  Email: ${email}
  Phone: ${phone || "Not provided"}
  
  Message:
  ${notes || "No message provided"}
      `.trim();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Seattle Freeze <noreply@updates.seattlefreezesquash.com>", // Update with your verified domain
        to: context.env.NOTIFICATION_EMAIL, // Your email
        subject: `New Sponsor Inquiry: ${company}`,
        text: emailBody,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend error:", error);
      throw new Error("Failed to send notification");
    }

    const response2 = await fetch(
      `https://api.resend.com/audiences/${context.env.RESEND_AUDIENCE_ID}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          first_name: name,
          last_name: company,
          audience_id: context.env.RESEND_AUDIENCE_ID,
        }),
      }
    );

    if (!response2.ok) {
      const error = await response2.text();
      console.error("Resend error:", error);
      throw new Error("Failed to add contact");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sponsor form error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
