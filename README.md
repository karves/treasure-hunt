# 🎮 Treasure Hunt Widget

An embeddable, gamified treasure hunt widget for making employee benefits and communications more engaging.

Built by the Mercer Impact Team ✨

---

## What is this?

A lightweight JavaScript widget that turns any webpage or document into an interactive treasure hunt. Users explore your content to find hidden treasures, learning as they go, and can enter a prize draw based on how many they collect.

### Key features

✨ **Lightweight** - Single JS file, no dependencies  
🔒 **Secure** - Minimal data collection (just email/ID for prize draw)  
📱 **Responsive** - Works beautifully on desktop and mobile  
🎨 **Customisable** - Easy to rebrand for different campaigns  
🔄 **Repeatable** - Deploy multiple campaigns across different sites  
🚀 **Two modes** - Manual placement (HTML control) or auto-placement (visual editors)

---

## Quick start

### For sites where you control HTML

1. Add the script:
```html
<script src="treasure-hunt.js"></script>
```

2. Place treasures in your content:
```html
<p>Your benefits are worth thousands <span data-treasure="egg-1">🥚</span> each year.</p>
```

3. Initialize:
```html
<script>
  TreasureHunt.init({
    mode: 'manual',
    totalTreasures: 5,
    submitEndpoint: 'https://your-api.com/entries'
  });
</script>
```

### For visual editors (Foleon, HubSpot, etc.)

1. Add via GTM or platform's custom code feature
2. Treasures appear automatically in safe content areas
3. That's it!

See [SETUP-GUIDE.md](SETUP-GUIDE.md) for detailed instructions.

---

## Files in this package

| File | Description |
|------|-------------|
| `treasure-hunt.js` | The main widget (works standalone) |
| `demo-manual-placement.html` | Demo with hand-placed treasures |
| `demo-auto-placement.html` | Demo with automatic placement |
| `SETUP-GUIDE.md` | Comprehensive setup instructions |
| `GTM-SETUP.md` | Google Tag Manager configuration guide |
| `mock-api-server.js` | Test API server for development |

---

## How it works

1. **User lands on page** → Welcome modal explains the hunt
2. **They explore content** → Find glowing treasures hidden throughout
3. **Collect treasures** → Progress tracker shows their count
4. **Reach threshold** → Can enter prize draw (more treasures = more entries)
5. **Submit email** → Entry is sent to your API endpoint

### Reward structure

Default setup:
- Find 3 treasures → 1 entry in draw
- Find 4 treasures → 2 entries in draw  
- Find 5 treasures → 5 entries in draw

Fully customisable - adjust to suit your campaign!

---

## Use cases

### Employee benefits
Make benefits guides actually engaging. Users learn about their perks whilst hunting for treasures.

**Example treasures:**
- 🥚 Easter theme for spring campaigns
- 🪙 Coins for financial wellness
- 💡 Lightbulbs for innovation content

### Internal communications
Drive engagement with company updates, policy changes, or training materials.

### Client deliverables
White-label the widget for client sites. Perfect for HR consultancies.

### Events and campaigns
Run time-limited hunts for product launches, awareness campaigns, or team challenges.

---

## Demo modes explained

### Manual placement mode
**Best for:** Sites where you can edit HTML directly (like weareimpact.mercer.com)

**Pros:**
- Complete control over treasure locations
- Place treasures in contextually relevant spots
- Can coordinate with visual design

**How it works:**
You manually add treasure markers to your HTML, and the widget makes them clickable.

See `demo-manual-placement.html` for example.

### Auto placement mode
**Best for:** Visual editors like Foleon, HubSpot, Wix, where you can't edit HTML

**Pros:**
- Zero HTML editing required
- Works via GTM or script injection
- Treasures appear automatically in safe content areas

**How it works:**
The widget scans the page for suitable elements (paragraphs, list items, captions) and randomly places treasures, avoiding navigation, headers, buttons, etc.

See `demo-auto-placement.html` for example.

---

## Customisation examples

### Different treasure themes

```javascript
// Easter campaign
treasureEmoji: '🥚'

// Financial wellness
treasureEmoji: '🪙'

// Innovation week
treasureEmoji: '💡'

// Wellbeing month
treasureEmoji: '❤️'

// Excellence awards
treasureEmoji: '⭐'
```

### Brand colours

```javascript
brandColors: {
  primary: '#752F8A',    // Mercer purple
  secondary: '#4A1259',  // Dark purple
  accent: '#B388FF'      // Light accent
}
```

### Different reward structures

```javascript
// Easy mode (more generous)
thresholds: {
  2: 1,   // 2 treasures = 1 entry
  3: 5,   // 3 treasures = 5 entries
  4: 10   // 4 treasures = 10 entries
}

// Challenge mode
thresholds: {
  5: 1,   // 5 treasures = 1 entry
  8: 2,   // 8 treasures = 2 entries
  10: 5   // 10 treasures = 5 entries
}
```

---

## API integration

The widget sends entries to your specified endpoint. You can use:

### Option 1: Google Forms (simplest)
Create a form, get the action URL, use as your endpoint. Zero code required.

### Option 2: Airtable
Store entries in an Airtable base. Easy to view and manage.

### Option 3: Custom API
Build your own endpoint for full control over the prize draw process.

### Option 4: Mock server (testing)
Use the included `mock-api-server.js` for local testing.

See [SETUP-GUIDE.md](SETUP-GUIDE.md) for API specifications.

---

## Testing

### Run the demos locally

1. Open `demo-manual-placement.html` in a browser
2. Open `demo-auto-placement.html` in a browser
3. Try finding all the treasures
4. Submit the form

### Test with mock API

1. Install Node.js
2. Run: `npm install express cors`
3. Run: `node mock-api-server.js`
4. Update demo files to use `http://localhost:3000/api/treasure-entries`
5. View dashboard at `http://localhost:3000`

### Test on your site

1. Deploy `treasure-hunt.js` to your server/CDN
2. Add to a test page
3. Check browser console for errors
4. Test on desktop and mobile
5. Verify form submission works
6. Check progress persists after refresh

---

## Browser support

- ✅ Chrome (desktop & mobile)
- ✅ Safari (desktop & mobile)
- ✅ Firefox
- ✅ Edge
- ✅ Samsung Internet

Requires:
- localStorage support (for progress saving)
- ES6 JavaScript (all modern browsers)

---

## Data privacy

The widget collects minimal data:
- Email address (or employee ID)
- Number of treasures found
- Time spent hunting (optional)
- Treasure IDs collected

**No tracking of:**
- Browsing behaviour
- IP addresses
- Personal information beyond email
- User location

All data is stored in the browser's localStorage until submission. After submission, it's sent to your specified endpoint - you control what happens to it.

---

## Deployment checklist

Before launching to real users:

- [ ] Test on all target browsers
- [ ] Verify mobile experience
- [ ] Check API endpoint receives submissions correctly
- [ ] Test localStorage persistence
- [ ] Confirm treasures are findable but not too easy
- [ ] Review copy in modals for typos
- [ ] Test with different screen sizes
- [ ] Verify colours match brand guidelines
- [ ] Set up monitoring for API errors
- [ ] Prepare prize draw process
- [ ] Test loading performance
- [ ] Check accessibility (keyboard navigation)

---

## Troubleshooting

### Treasures not appearing
- Check browser console for errors
- Verify script loaded (check Network tab)
- For manual mode: Check data attributes are correct
- For auto mode: Increase totalTreasures or adjust selectors

### Form not submitting
- Check Network tab for failed requests
- Verify endpoint URL is correct
- Check CORS headers if endpoint is on different domain
- Test endpoint with Postman/curl

### Wrong brand colours
- Verify hex codes are valid (include #)
- Clear browser cache
- Check for CSS conflicts

### Progress not saving
- Check localStorage isn't blocked
- Try incognito mode
- Verify storageKey doesn't conflict with other scripts

See [SETUP-GUIDE.md](SETUP-GUIDE.md) for more troubleshooting tips.

---

## Future enhancements

Ideas for v2:

- [ ] Leaderboard mode (fastest times)
- [ ] Team competitions
- [ ] Hints system for stuck users
- [ ] Social sharing
- [ ] Multi-language support
- [ ] Admin dashboard for real-time stats
- [ ] Integration with popular HR platforms
- [ ] Sound effects (optional)
- [ ] Achievement badges
- [ ] Difficulty levels

---

## Support

Questions? Issues? Ideas?

- **Email:** impact@mercer.com
- **Internal Slack:** #impact-team
- **GitHub:** (Add repo URL when ready)

---

## Credits

Created with love and sparkle by:
- **Strategy & concept:** Kaivai (Impact Team)
- **Motion graphics:** Claudia
- **Development:** Claude (with your brilliant direction!)

---

## Licence

**Proprietary** - For Mercer internal use and authorised client deployments only.

Unauthorised copying, distribution, or use is strictly prohibited.

© 2026 Mercer LLC. All rights reserved.

For licensing enquiries: impactteam@mercer.com

---

## What's next?

1. **Test the demos** - Open the HTML files and try it out
2. **Customise for Impact site** - Adjust colours, treasures, copy
3. **Deploy to weareimpact.mercer.com** - Use manual placement mode
4. **Test with Foleon** - Try auto-placement mode
5. **Iterate based on feedback** - Adjust difficulty, rewards, design
6. **Scale to clients** - Package it up for external use

Ready to add some sparkle to employee comms? Let's go! ✨🎮
