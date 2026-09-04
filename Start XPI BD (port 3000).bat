@echo off
title XPI BD Intelligence (XPI) - keep this window open
cd /d "C:\Users\Kedrick Levy\xpi-bd-intelligence"
set BD_PROFILE=xpi
set PORT=3000
echo ============================================================
echo   XPI BD Intelligence  (recommends XPI products)
echo   Opening http://localhost:3000  ...
echo   KEEP THIS WINDOW OPEN.  To stop: Ctrl + C
echo ============================================================
echo.
start "" /b cmd /c "ping -n 4 127.0.0.1 >nul & start http://localhost:3000"
npm start
echo.
echo (Server stopped. You can close this window.)
pause
