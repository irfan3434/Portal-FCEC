require('dotenv').config();
const express = require('express');
const { ConfidentialClientApplication } = require('@azure/msal-node');
const path = require('path'); // Add this line at the top

const SERVER_PORT = process.env.PORT || 5500;
const REDIRECT_URI = "http://localhost:5500/redirect";

const msalConfig = {
    auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
    }
};

const app = express();
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// MSAL client
const msalClient = new ConfidentialClientApplication(msalConfig);

// Trigger Azure AD login
app.get('/login', (req, res) => {
    const authUrl = msalClient.getAuthCodeUrl({
        scopes: ["user.read"],
        redirectUri: REDIRECT_URI,
    }).then((url) => {
        res.redirect(url);
    }).catch((error) => {
        console.log(JSON.stringify(error));
        res.status(500).send('Error starting authentication');
    });
});

// Handle redirect from Azure AD with an authorization code
app.get('/redirect', async (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri: REDIRECT_URI,
    };

    try {
        const response = await msalClient.acquireTokenByCode(tokenRequest);
        console.log(response);
        // Use the tokens returned in the response to access protected resources
        res.send('Login successful');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error completing authentication');
    }
});

app.listen(SERVER_PORT, () => {
    console.log(`Server running on http://localhost:${SERVER_PORT}`);
});
