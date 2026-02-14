// Test script to verify wallet delete endpoint
const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function testWalletDelete() {
    try {
        console.log('🧪 Testing wallet delete endpoint...\n');
        
        // First, get the access token from localStorage (you'll need to provide this)
        const token = process.env.ACCESS_TOKEN;
        
        if (!token) {
            console.error('❌ Please provide ACCESS_TOKEN environment variable');
            console.log('   Get it from browser localStorage.getItem("accessToken")');
            process.exit(1);
        }
        
        // Get all wallets
        console.log('1️⃣ Fetching wallets...');
        const walletsResponse = await axios.get(`${API_URL}/wallets`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`   Found ${walletsResponse.data.length} wallets`);
        walletsResponse.data.forEach(w => {
            console.log(`   - ${w.id}: ${w.address} (active: ${w.isActive})`);
        });
        
        if (walletsResponse.data.length === 0) {
            console.log('\n❌ No wallets found to test delete');
            return;
        }
        
        const walletToDelete = walletsResponse.data[0];
        console.log(`\n2️⃣ Attempting to delete wallet: ${walletToDelete.id}`);
        
        // Delete the wallet
        const deleteResponse = await axios.delete(`${API_URL}/wallets/${walletToDelete.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('   ✅ Delete response:', deleteResponse.data);
        
        // Verify it's deleted
        console.log('\n3️⃣ Verifying deletion...');
        const verifyResponse = await axios.get(`${API_URL}/wallets`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`   Found ${verifyResponse.data.length} active wallets`);
        const stillExists = verifyResponse.data.find(w => w.id === walletToDelete.id);
        
        if (stillExists) {
            console.log('   ❌ Wallet still exists in active wallets!');
        } else {
            console.log('   ✅ Wallet successfully removed from active wallets');
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Headers:', error.response.headers);
        }
    }
}

testWalletDelete();
