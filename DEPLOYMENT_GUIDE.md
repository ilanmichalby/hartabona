# Deploying Hartabona to the Web

## Option 1: Netlify (Recommended - Free & Easy)

### Steps:
1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub account and select your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variables:
     - `VITE_SUPABASE_URL`: Your Supabase URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - Click "Deploy site"

3. **Your app will be live** at a URL like `https://your-app-name.netlify.app`

## Option 2: Vercel (Also Free & Easy)

### Steps:
1. Push code to GitHub (same as above)
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables (same as Netlify)
5. Deploy!

## Option 3: GitHub Pages (Free but requires more setup)

Not recommended for this app since it uses client-side routing.

## After Deployment:

Your game will be accessible at the deployed URL. Players can:
- Visit the URL directly
- Create or join games using game codes
- Share the URL with friends to play together

## Custom Domain (Optional):

Both Netlify and Vercel allow you to add a custom domain for free!
