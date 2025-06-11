// Import the Resend library and dotenv for environment variables
// Use require for CommonJS
const { Resend } = require("resend");
const dotenv = require("dotenv");


// Load environment variables from a .env file into process.env
dotenv.config();

// --- Configuration ---
// Get your Resend API Key from environment variables
const resendApiKey = 're_2KUvmZ5b_FRtSSS7UMveKAKaZGGyqTgRY';
// Get your verified Resend domain from environment variables
const verifiedDomain = '4minmail.org'; // e.g., 'yourdomain.com'

// --- Email Details ---
// IMPORTANT: Replace with the actual email address of your friend
const friendEmail = "levelupdude@proton.me";
// Set the 'from' address using your verified domain
// You can customize the part before the '@' (e.g., 'hello', 'info', 'yourname')
const senderEmail = `hello@${verifiedDomain}`;
const emailSubject = "Checking in from my Node app!";
const emailHtmlBody = `
  <h1>Hi Friend!</h1>
  <p>Just wanted to send you a quick email using the Resend API and Node.js.</p>
  <p>It's working!</p>
  <p>Best,</p>
  <p>Your Name</p>
`; // You can customize this HTML content

// --- Validation ---
// Check if the API key and domain were loaded correctly
if (!resendApiKey) {
  console.error(
    "Error: RESEND_API_KEY is not set in your environment variables.",
    "Please create a .env file and add RESEND_API_KEY=your_api_key",
  );
  process.exit(1); // Exit if API key is missing
}
if (!verifiedDomain) {
  console.error(
    "Error: RESEND_VERIFIED_DOMAIN is not set in your environment variables.",
    "Please create a .env file and add RESEND_VERIFIED_DOMAIN=your_verified_domain.com",
  );
  process.exit(1); // Exit if domain is missing
}
if (friendEmail === "friend@example.com") {
  console.warn(
    "Warning: Please replace 'friend@example.com' in sendMyEmail.js with your friend's actual email address.",
  );
}

// --- Initialize Resend ---
const resend = new Resend(resendApiKey);

// --- Send Email Function ---
async function sendEmailToFriend() {
  console.log(`Preparing to send email from ${senderEmail} to ${friendEmail}...`);
  try {
    // Use the resend.emails.send method
    const { data, error } = await resend.emails.send({
      from: senderEmail, // Must be from your verified domain
      to: [friendEmail], // Recipient email address(es) in an array
      subject: emailSubject, // Email subject line
      html: emailHtmlBody, // HTML content of the email
      // You could also add 'text: "Plain text content"' for non-HTML clients
    });

    // Handle potential errors from the Resend API
    if (error) {
      console.error("Error sending email via Resend:");
      console.error(error);
      return;
    }

    // Log success message and the response data from Resend
    console.log("Email sent successfully!");
    console.log("Resend Response ID:", data?.id); // Log the ID on success

  } catch (exception) {
    // Catch any other errors during the process
    console.error("An unexpected error occurred:");
    console.error(exception);
  }
}

// --- Execute the function ---
sendEmailToFriend();
