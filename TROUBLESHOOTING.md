# Test Script for Export Features

## Test 1: Check Backend is Running
Open browser and go to:
```
http://localhost:3001/health
```
Should see: `{"status":"ok","timestamp":"..."}`

## Test 2: Test CSV Export (requires auth token)
1. Login to the app at http://localhost:5173
2. Open browser DevTools (F12)
3. Go to Application/Storage → Local Storage
4. Copy the "token" value
5. Run in terminal:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3001/api/export/csv -o test.csv
```

## Test 3: Test PDF Download
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3001/api/invoices/inv-1/pdf -o test.pdf
```

## Common Issues:

### Issue 1: "Cannot GET /api/export/csv"
**Solution**: Backend not running or route not loaded
```bash
cd backend
npm install
npm run dev
```

### Issue 2: "Network Error" in browser
**Solution**: CORS or backend not accessible
- Check backend is on port 3001
- Check frontend is on port 5173

### Issue 3: "Download starts but file is empty/broken"
**Solution**: Check browser console for errors
- Press F12
- Click on Console tab
- Try export again
- Share any red errors you see

### Issue 4: Click does nothing
**Solution**: JavaScript error - check console
- F12 → Console tab
- Look for errors in red
