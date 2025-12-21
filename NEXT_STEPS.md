# Git Setup & Deployment Steps

## ✅ Completed
- Git repository initialized
- Files staged for commit

## 📝 Next Steps

### 1. Configure Git (First Time Only)
Run these commands to set your Git identity:

```bash
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

Replace with your actual email and name.

### 2. Commit Your Code
```bash
git commit -m "Initial commit - Hartabona game"
```

### 3. Create GitHub Repository
1. Go to [github.com](https://github.com)
2. Click the "+" icon → "New repository"
3. Name it "hartabona" (or any name you like)
4. **Don't** initialize with README (we already have files)
5. Click "Create repository"

### 4. Connect to GitHub
GitHub will show you commands. Use these:

```bash
git remote add origin https://github.com/YOUR_USERNAME/hartabona.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### 5. Deploy on Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign up/Login (can use GitHub account)
3. Click "Add new site" → "Import an existing project"
4. Choose GitHub and select your "hartabona" repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **Environment variables** (IMPORTANT!):
   - Click "Add environment variables"
   - Add:
     - `VITE_SUPABASE_URL` = `https://rlfmqyfdhlikjxxreknd.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZm1xeWZkaGxpa2p4eHJla25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODgyNTIsImV4cCI6MjA4MDM2NDI1Mn0.AZyWipQvkkpH1dSfx7hZhwAXrmZ-UQrmA6yzOCBKkco`
7. Click "Deploy site"

### 6. Your Game is Live! 🎉
Netlify will give you a URL like: `https://your-app-name.netlify.app`

Share this URL with friends to play!

## 🔗 Direct Game Links
Once deployed, players can join directly via:
`https://your-app-name.netlify.app/?code=GAMECODE`
