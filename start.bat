@echo off
title GeoPulse - Disaster Relief Dispatch Platform
echo =========================================================
echo       GeoPulse: Real-Time Hyperlocal Disaster Dispatch
echo                 Pure MongoDB Core System
echo =========================================================
echo.
echo [1/2] Launching GeoPulse Console in your default browser...
start http://localhost:5000
echo.
echo [2/2] Starting Node.js backend with MongoDB 2dsphere & TTL...
cd /d "%~dp0geopulse-backend"
node server.js
pause
