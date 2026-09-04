@echo off
title BD Intelligence CORE (white-label) - keep this window open
cd /d "C:\Users\Kedrick Levy\xpi-bd-intelligence"
set BD_PROFILE=core
set PORT=3001
echo ============================================================
echo   BD Intelligence - CORE (white-label, your own catalog)
echo   Opening http://localhost:3001  ...
echo   KEEP THIS WINDOW OPEN.  To stop: Ctrl + C
echo   (Edit lib\catalog.core.js to load your own products.)
echo ============================================================
echo.
start "" /b cmd /c "ping -n 4 127.0.0.1 >nul & start http://localhost:3001"
npm start
echo.
echo (Server stopped. You can close this window.)
pause
