const axios = require('axios');
const fs = require('fs');
const qs = require('querystring');
const winston = require('winston');
const colors = require('colors');
const Table = require('cli-table3');
const gradient = require('gradient-string');

// Setup logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.printf(({ timestamp, level, message }) => {
        return ${timestamp} [${level.toUpperCase()}] ${message};
    }),
    transports: [new winston.transports.Console()],
});

// Define clear task URL
const CLEAR_TASK_URL = 'https://r8-server-production.up.railway.app/api/task/task';

// Function to parse Telegram Web App data
function parseTgWebAppData(data) {
    try {
        const parsedData = qs.parse(data);
        const tgWebAppData = JSON.parse(decodeURIComponent(parsedData.info || ''));
        return {
            user: tgWebAppData,
            chat_instance: parsedData.chat_instance || '',
            chat_type: parsedData.chat_type || '',
            auth_date: parsedData.auth_date || '',
            signature: parsedData.signature || '',
            hash: parsedData.hash || ''
        };
    } catch (error) {
        logger.error(Error parsing tgWebApp data: ${error.message});
        return null;
    }
}

// Function to load accounts from a file
function loadAccounts(filePath = 'data.txt') {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const accounts = fileContent.split('\n').map(line => line.trim());
        const parsedAccounts = accounts.map(account => parseTgWebAppData(account)).filter(account => account);
        return parsedAccounts;
    } catch (error) {
        logger.error(File ${filePath} not found.);
        return [];
    }
}

// Function to clear a task
async function clearTask(taskId, userData) {
    const headers = {
        'authority': 'r8-server-production.up.railway.app',
        'method': 'POST',
        'path': /api/task?taskId=${taskId},
        'scheme': 'https',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://rebor-app.vercel.app',
        'Referer': 'https://rebor-app.vercel.app',
        'Tg-Webapp-Data': encodeURIComponent(JSON.stringify(userData))
    };

    const payload = {
        action: 'complete',
        taskId,
        telegramId: String(userData.user.id),
        type: 'daily'
    };

    try {
        const response = await axios.post(CLEAR_TASK_URL, payload, { headers });
        logger.info(Task cleared successfully. Status: ${response.status});
        return true;
    } catch (error) {
        logger.error(Failed to clear task ${taskId}: ${error.message});
        return false;
    }
}

// Function to display header in the console
function displayHeader() {
    const table = new Table({
        head: [gradient.pastel('Rebor Bot - Balance Injector')],
        colWidths: [50],
        style: { 'padding-left': 1, 'padding-right': 1 }
    });
    table.push(['🚀 Boost your Rebor balance with ease!']);
    console.log(table.toString());
}

// Main function to start the process
async function main() {
    displayHeader();

    const accounts = loadAccounts();
    if (!accounts.length) {
        logger.error('No accounts found!');
        return;
    }

    accounts.forEach(account => {
        logger.info(Account ID: ${account.user.id}.cyan);
    });

    async function processTasks() {
        while (true) {
            for (const account of accounts) {
                for (const taskId of ['1', '2']) {
                    const result = await clearTask(taskId, account);
                    await new Promise(resolve => setTimeout(resolve, result ? 1000 : 3600000));
                }
            }
        }
    }

    await processTasks();
}

// Execute main function
main().catch(error => logger.error(Error in main: ${error.message}));
﻿