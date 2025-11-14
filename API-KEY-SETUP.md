# 🔑 OpenAI API Key Setup

Kommentify uses OpenAI's GPT-4 for generating authentic, engaging LinkedIn content. You'll need to provide your own OpenAI API key.

---

## 📝 Why You Need Your Own API Key

**Benefits:**
- ✅ **Full Control** - You own the API usage and data
- ✅ **Lower Cost** - Pay only for what you use (~$2-6/month typical)
- ✅ **Better Quality** - Direct access to latest GPT-4 models
- ✅ **Privacy** - Your content stays between you and OpenAI
- ✅ **No Middleman** - Faster, more reliable service

**vs Bundled Solutions:**
- ❌ Pay $50-200/month for worse quality
- ❌ Shared quotas and rate limits
- ❌ Generic, templated comments
- ❌ Your data goes through third party
- ❌ No control over prompts or models

---

## 🚀 Quick Setup (3 Minutes)

### Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an OpenAI account
3. Click **"Create new secret key"**
4. Give it a name (e.g., "Kommentify")
5. **Copy the key** (starts with `sk-proj-...`)
6. **Save it securely** - you can't see it again!

### Step 2: Configure Kommentify

**Option A: Automated Setup (Recommended)**
```bash
npm run setup
```
- Paste your API key when prompted
- Key will be saved to `src/config/api-key.ts`
- File is auto-added to .gitignore (secure)

**Option B: Manual Configuration**
1. Open the extension popup
2. Go to Settings tab
3. Find "OpenAI API Key" section
4. Paste your key
5. Click "Save"

**Option C: Edit Config File**
1. Create `src/config/api-key.ts`:
```typescript
export const OPENAI_API_KEY = 'your-api-key-here';
```
2. This file is gitignored for security

---

## 💰 Cost Breakdown

### OpenAI Pricing (Pay-as-you-go):

**GPT-4o-mini** (for comments):
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens
- **~$0.001 per comment** (0.1 cents)

**GPT-4o** (for posts):
- Input: $2.50 per 1M tokens
- Output: $10.00 per 1M tokens
- **~$0.02 per post** (2 cents)

### Real-World Usage:

**Light User** (50 comments/day):
- ~1,500 comments/month
- Cost: **~$1.50/month**

**Medium User** (100 comments/day + 10 posts/week):
- ~3,000 comments + 40 posts/month
- Cost: **~$3.80/month**

**Heavy User** (200 comments/day + 20 posts/week):
- ~6,000 comments + 80 posts/month
- Cost: **~$7.60/month**

**Compare to:**
- Typical LinkedIn automation: $50-200/month
- You save: **90-95%** with better quality!

---

## 🔐 Security Best Practices

### ✅ DO:
- Keep your API key private
- Use rate limits on OpenAI dashboard
- Monitor your usage monthly
- Regenerate key if compromised
- Store in secure password manager

### ❌ DON'T:
- Share your API key with anyone
- Commit `api-key.ts` to git (it's gitignored)
- Post screenshots showing your key
- Use same key across multiple tools
- Leave billing limits unconfigured

---

## 📊 Monitoring Usage

### OpenAI Dashboard:
1. Go to https://platform.openai.com/usage
2. See real-time usage and costs
3. Set monthly spending limits
4. Get alerts when approaching limit

### Recommended Limits:
- **Starter**: $10/month cap
- **Regular**: $25/month cap
- **Heavy**: $50/month cap

If you hit your limit, extension will gracefully fall back to basic comments.

---

## ❓ FAQ

**Q: Do I have to pay for OpenAI separately?**
A: Yes, but it's much cheaper than bundled solutions. Typical cost: $2-6/month vs $50-200/month for competitors.

**Q: What if I don't want to pay for OpenAI?**
A: You can still use all automation features. AI comment generation will be disabled, and manual/template comments will be used instead.

**Q: Is my API key safe?**
A: Yes! It's stored locally in Chrome Storage on your device only. Never sent to our servers. The `api-key.ts` file is also gitignored.

**Q: Can I use the same key for multiple extensions?**
A: Yes, but we recommend separate keys for better tracking and security.

**Q: What happens if my key is compromised?**
A: Regenerate immediately on OpenAI dashboard. Update in Kommentify. Old key stops working instantly.

**Q: How do I know if AI is working?**
A: Check browser console (F12) - you'll see "✅ AI comment generated" messages. Also, comments will be unique and contextual.

**Q: Can I switch models or adjust prompts?**
A: Not in UI currently. Advanced users can edit `src/core/ai-service.ts` to customize prompts.

**Q: What if OpenAI is down?**
A: Extension falls back to high-quality template comments automatically.

---

## 🆘 Troubleshooting

### "API Error: 401 Unauthorized"
- Your API key is invalid or expired
- Regenerate key on OpenAI dashboard
- Update in Kommentify settings

### "API Error: 429 Rate Limit"
- You've hit OpenAI rate limits
- Wait a few minutes
- Check usage on OpenAI dashboard
- Consider upgrading OpenAI plan tier

### "API Error: 402 Payment Required"
- You've exceeded your billing limit
- Add payment method on OpenAI dashboard
- Increase monthly spending limit

### "No AI comments being generated"
- Check browser console for errors
- Verify API key is set (Settings tab)
- Ensure AI features are enabled
- Check OpenAI dashboard for issues

### "Comments are generic/template-like"
- This means AI failed, using fallback
- Check API key is correct
- Verify you have OpenAI credits
- Check browser console for error details

---

## 🎓 Next Steps

Once API key is configured:

1. **Test It**: Click "Create Lead Magnet Post" to verify
2. **Start Automating**: Enable automation on Dashboard
3. **Monitor**: Check OpenAI usage after first day
4. **Optimize**: Adjust comment frequency based on costs
5. **Scale**: Increase as you see ROI

---

## 📞 Need Help?

- **OpenAI Issues**: https://help.openai.com
- **Kommentify Issues**: support@kommentify.com
- **Setup Issues**: Check browser console (F12)
- **Billing Questions**: OpenAI dashboard

---

**🎉 Ready to generate authentic LinkedIn content!**

Your API key gives you unlimited access to the world's best AI for a fraction of the cost of traditional tools.
