
const { createClient } = require('@supabase/supabase-js');

// Hardcoded for testing
const supabaseUrl = 'https://szmzdxxypdxtloblgkay.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bXpkeHh5cGR4dGxvYmxna2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDg1NDUsImV4cCI6MjA4NTA4NDU0NX0.yxEoggrmM_nFKnDkC461hOFo2Apb3tilBfIT7LaYdhM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("Testing connection to:", supabaseUrl);

async function testConnection() {
    try {
        const start = Date.now();
        const { data, error } = await supabase.from('gyms').select('count', { count: 'exact', head: true });

        const duration = (Date.now() - start) / 1000;
        console.log(`Request took ${duration} seconds`);

        if (error) {
            console.error("Connection FAILED:", error.message);
        } else {
            console.log("Connection SUCCESS! Database is awake.");
        }
    } catch (e) {
        console.error("System Error:", e.message);
    }
}

testConnection();
