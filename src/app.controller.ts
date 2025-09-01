import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getApiStatus(@Res() res: Response) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Neat Shoecare API</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 1rem;
            }
            .card {
                background: #ffffff;
                border-radius: 12px;
                max-width: 420px;
                width: 100%;
                padding: 2.5rem;
                box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
                position: relative;
                border: 1px solid rgba(0, 0, 0, 0.05);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .card:hover {
                box-shadow: 0px 3px 3px -2px rgba(0,0,0,0.2), 0px 3px 4px 0px rgba(0,0,0,0.14), 0px 1px 8px 0px rgba(0,0,0,0.12);
                transform: translateY(-2px);
            }
            .date {
                color: #64748b;
                font-size: 0.875rem;
                font-weight: 500;
                position: absolute;
                top: 2rem;
                left: 2.5rem;
                letter-spacing: -0.025em;
                font-variant-numeric: tabular-nums;
            }
            .status-indicator {
                width: 24px;
                height: 24px;
                background: linear-gradient(135deg, #004AAD 0%, #0056c7 100%);
                border-radius: 50%;
                position: absolute;
                top: 2rem;
                right: 2.5rem;
                animation: pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            .status-indicator::before {
                content: '';
                position: absolute;
                top: -4px;
                left: -4px;
                right: -4px;
                bottom: -4px;
                border: 2px solid rgba(0, 74, 173, 0.3);
                border-radius: 50%;
                animation: ripple 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.8;
                    transform: scale(1.05);
                }
            }
            @keyframes ripple {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                100% {
                    transform: scale(2);
                    opacity: 0;
                }
            }
            .content {
                margin-top: 3.5rem;
            }
            h1 {
                color: #0f172a;
                font-size: 1.8rem;
                font-weight: 700;
                line-height: 1.2;
                margin-bottom: 0.5rem;
                letter-spacing: -0.05em;
                background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .subtitle {
                color: #64748b;
                font-size: 1rem;
                font-weight: 500;
                letter-spacing: -0.025em;
                opacity: 0.9;
            }
            @media (max-width: 480px) {
                .card {
                    padding: 2rem;
                    margin: 1rem;
                    max-width: calc(100% - 2rem);
                }
                .date, .status-indicator {
                    top: 2rem;
                }
                .date {
                    left: 2rem;
                    font-size: 0.8125rem;
                }
                .status-indicator {
                    right: 2rem;
                    width: 20px;
                    height: 20px;
                }
                .content {
                    margin-top: 3rem;
                }
                h1 {
                    font-size: 2rem;
                }
                .subtitle {
                    font-size: 1rem;
                }
            }
        </style>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body>
        <div class="card">
            <div class="date" id="currentDate"></div>
            <div class="status-indicator"></div>
            <div class="content">
                <h1>API is ready to use</h1>
                <div class="subtitle">Neat Shoecare Service</div>
            </div>
        </div>
        <script>
            function updateDateTime() {
                const now = new Date();
                
                const day = String(now.getDate()).padStart(2, '0');
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const year = now.getFullYear();
                
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                
                const formatted = day + '.' + month + '.' + year + ' • ' + hours + ':' + minutes + ':' + seconds;
                document.getElementById('currentDate').textContent = formatted;
            }
            
            updateDateTime();
            setInterval(updateDateTime, 1000);
        </script>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}