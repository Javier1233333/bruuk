const url = "https://dzygjdoiffyhaoscztka.supabase.co/rest/v1/";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6eWdqZG9pZmZ5aGFvc2N6dGthIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDA2MDc1MiwiZXhwIjoyMDk5NjM2NzUyfQ.90QfAoP7VSAaoVWhAbvLUfKnaDKHBQDGqj3_2VLaMpM";

fetch(url, {
  headers: {
    "apikey": serviceRoleKey,
    "Authorization": `Bearer ${serviceRoleKey}`
  }
})
.then(res => res.json())
.then(data => {
  const profilesDefinition = data.definitions.profiles;
  console.log("Profiles columns from OpenAPI:", profilesDefinition ? Object.keys(profilesDefinition.properties) : "Profiles definition not found");
  console.log("Profiles properties details:", profilesDefinition ? profilesDefinition.properties : "");
})
.catch(err => console.error("Error fetching schema info:", err));
