import { useState } from "react";
import { Button, Input, Toast, ToastContainer } from "../../components/ui";

export function CustodianInvites() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normalize to E.164
    let normalizedPhone = phone.trim().replace(/\D/g, "");
    if (normalizedPhone.length === 10) {
      normalizedPhone = "+91" + normalizedPhone; // Default to India if only 10 digits
    } else if (!normalizedPhone.startsWith("+")) {
      normalizedPhone = "+" + normalizedPhone;
    }

    setLoading(true);
    
    // In a real app, this would call a Cloud Function to pre-provision 
    // the user in Firebase Auth or send an SMS via an integration.
    // For now, we mock a successful API call.
    console.log(`Sending invite to: ${normalizedPhone}`);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setName("");
      setPhone("");
    }, 1000);
  };

  return (
    <div className="max-w-md bg-white rounded-tag p-6 shadow-tag animate-fade-up">
      <h2 className="font-display text-2xl text-ink-bark mb-2">Invite Custodian</h2>
      <p className="font-sans text-sm text-slate-bark mb-6">
        Create a profile for a new Custodian. They will receive an SMS with an OTP to log in.
      </p>

      <form onSubmit={handleInvite} className="flex flex-col gap-4">
        <Input 
          label="Full Name" 
          placeholder="e.g. Ramesh Kumar"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input 
          label="Phone Number" 
          placeholder="+91 98765 43210"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <div className="mt-4">
          <Button type="submit" loading={loading} fullWidth>
            Send Invite SMS
          </Button>
        </div>
      </form>

      <ToastContainer>
        {success && <Toast variant="success" message="Invite sent successfully!" onDismiss={() => setSuccess(false)} />}
      </ToastContainer>
    </div>
  );
}
