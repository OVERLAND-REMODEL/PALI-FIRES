export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();

    const botField = formData.get("bot-field");
    if (botField) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const firstName = clean(formData.get("first-name"));
    const lastName = clean(formData.get("last-name"));
    const phone = clean(formData.get("phone"));
    const email = clean(formData.get("email"));
    const propertyAddress = clean(formData.get("property-address"));
    const rebuildStage = clean(formData.get("rebuild-stage"));
    const details = clean(formData.get("project-details"));

    const landingPage = clean(formData.get("landing-page"));
    const utmSource = clean(formData.get("utm-source"));
    const utmMedium = clean(formData.get("utm-medium"));
    const utmCampaign = clean(formData.get("utm-campaign"));
    const utmTerm = clean(formData.get("utm-term"));
    const utmContent = clean(formData.get("utm-content"));
    const gclid = clean(formData.get("gclid"));

    if (!firstName || !phone || !email) {
      return jsonResponse(
        { ok: false, message: "Missing required fields." },
        400
      );
    }

    const subject = `New Pacific Palisades Rebuild Lead — ${firstName} ${lastName}`;

    const textBody = `
New Pacific Palisades Rebuild Lead

Name: ${firstName} ${lastName}
Phone: ${phone}
Email: ${email}

Property Address:
${propertyAddress || "Not provided"}

Current Stage:
${rebuildStage || "Not provided"}

Project Details:
${details || "Not provided"}

Tracking:
Landing Page: ${landingPage || "Not provided"}
UTM Source: ${utmSource || "Not provided"}
UTM Medium: ${utmMedium || "Not provided"}
UTM Campaign: ${utmCampaign || "Not provided"}
UTM Term: ${utmTerm || "Not provided"}
UTM Content: ${utmContent || "Not provided"}
GCLID: ${gclid || "Not provided"}
`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #181A1B; line-height: 1.6;">
        <h2>New Pacific Palisades Rebuild Lead</h2>

        <p><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>

        <hr>

        <p><strong>Property Address:</strong><br>${escapeHtml(propertyAddress || "Not provided")}</p>
        <p><strong>Current Stage:</strong><br>${escapeHtml(rebuildStage || "Not provided")}</p>
        <p><strong>Project Details:</strong><br>${escapeHtml(details || "Not provided").replace(/\n/g, "<br>")}</p>

        <hr>

        <h3>Tracking</h3>
        <p><strong>Landing Page:</strong> ${escapeHtml(landingPage || "Not provided")}</p>
        <p><strong>UTM Source:</strong> ${escapeHtml(utmSource || "Not provided")}</p>
        <p><strong>UTM Medium:</strong> ${escapeHtml(utmMedium || "Not provided")}</p>
        <p><strong>UTM Campaign:</strong> ${escapeHtml(utmCampaign || "Not provided")}</p>
        <p><strong>UTM Term:</strong> ${escapeHtml(utmTerm || "Not provided")}</p>
        <p><strong>UTM Content:</strong> ${escapeHtml(utmContent || "Not provided")}</p>
        <p><strong>GCLID:</strong> ${escapeHtml(gclid || "Not provided")}</p>
      </div>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [env.TO_EMAIL],
        reply_to: email,
        subject,
        text: textBody,
        html: htmlBody
      })
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend error:", errorText);

      return jsonResponse(
        { ok: false, message: "Email failed to send." },
        500
      );
    }

    return jsonResponse({ ok: true, message: "Lead sent successfully." }, 200);

  } catch (error) {
    console.error("Function error:", error);

    return jsonResponse(
      { ok: false, message: "Something went wrong." },
      500
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

function clean(value) {
  return value ? String(value).trim() : "";
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
