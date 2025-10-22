export async function onRequestPost(context) {
  try {
    const { email } = await context.request.json();

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch(
      `https://api.resend.com/audiences/${context.env.RESEND_AUDIENCE_ID}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          audience_id: context.env.RESEND_AUDIENCE_ID,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend error:", error);
      throw new Error("Failed to add contact");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
