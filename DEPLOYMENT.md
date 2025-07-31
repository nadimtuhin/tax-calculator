# Deployment Checklist and Rollback Plan

This document provides a comprehensive deployment checklist and rollback plan for the Bangladesh Tax Calculator with the new dual tax comparison feature.

## Pre-Deployment Checklist

### Code Quality & Testing
- [ ] All unit tests passing (`npm run test`)
- [ ] All integration tests passing
- [ ] All e2e tests passing (`npm run test:e2e`)
- [ ] ESLint checks passing (`npm run lint`)
- [ ] TypeScript compilation successful (if applicable)
- [ ] No console errors or warnings in browser console
- [ ] Code review completed and approved
- [ ] All TODO comments resolved or documented for future releases

### Feature Validation
- [ ] Dual tax comparison displays correctly on desktop
- [ ] Dual tax comparison works on mobile devices
- [ ] Tax calculations are accurate for both FY 2024-25 and 2025-26
- [ ] All taxpayer categories work correctly (General, Female, Senior, Disabled, etc.)
- [ ] Investment rebate calculations work with new progressive rates
- [ ] Minimum tax calculations reflect unified ৳5,000 for 2025-26
- [ ] Comparison summary shows correct savings/additional tax
- [ ] Edge cases handled properly (zero income, very high income, etc.)
- [ ] Data persistence works across page reloads
- [ ] Export/Import functionality still works

### Performance & Compatibility
- [ ] Page load time under 3 seconds on 3G connection
- [ ] Tax calculations complete within 500ms
- [ ] No memory leaks with repeated calculations
- [ ] Cross-browser compatibility tested:
  - [ ] Chrome (latest 2 versions)
  - [ ] Firefox (latest 2 versions)
  - [ ] Safari (latest 2 versions)
  - [ ] Edge (latest 2 versions)
- [ ] Mobile browser compatibility tested:
  - [ ] Chrome Mobile
  - [ ] Safari iOS
  - [ ] Samsung Internet
- [ ] Responsive design working on all screen sizes (320px+)

### Documentation & Communication
- [ ] README.md updated with new features
- [ ] DUAL_TAX_COMPARISON.md documentation complete
- [ ] Changelog updated with new version
- [ ] Breaking changes documented (if any)
- [ ] User communication prepared (if needed)

## Deployment Process

### 1. Pre-Deployment Steps
```bash
# Ensure clean working directory
git status

# Pull latest changes
git pull origin master

# Install dependencies
npm ci

# Run full test suite
npm run test:all

# Build production version
npm run build

# Verify build output
ls -la dist/
```

### 2. Backup Current Version
```bash
# Create backup of current live version
# This varies by hosting platform - examples:

# For static hosting (Netlify, Vercel, etc.)
# Download current live files or note current deployment ID

# For server deployment
sudo cp -r /var/www/html /var/www/html.backup.$(date +%Y%m%d_%H%M%S)
```

### 3. Deploy New Version
```bash
# Example for static hosting deployment
npm run build
# Deploy dist/ folder to hosting platform

# Example for server deployment
sudo cp -r dist/* /var/www/html/
sudo systemctl reload nginx  # if using nginx
```

### 4. Post-Deployment Validation
- [ ] Site loads without errors
- [ ] Both tax calculations display correctly
- [ ] Input changes trigger updates in both panels
- [ ] Comparison summary shows accurate results
- [ ] Mobile layout works properly
- [ ] Performance is acceptable
- [ ] No JavaScript errors in console
- [ ] Analytics/monitoring tools still work

## Rollback Plan

### Immediate Rollback (< 15 minutes)
If critical issues are discovered immediately after deployment:

#### For Static Hosting (Netlify, Vercel, etc.)
1. **Revert to previous deployment**:
   - Go to hosting platform dashboard
   - Find previous deployment
   - Click "Restore" or "Rollback"
   - Confirm rollback action

#### For Server Deployment
1. **Restore from backup**:
   ```bash
   # Stop web server
   sudo systemctl stop nginx
   
   # Restore backup (replace TIMESTAMP with actual backup timestamp)
   sudo rm -rf /var/www/html
   sudo mv /var/www/html.backup.TIMESTAMP /var/www/html
   
   # Start web server
   sudo systemctl start nginx
   ```

2. **Verify rollback**:
   - [ ] Site loads properly
   - [ ] Basic functionality works
   - [ ] No error messages

### Planned Rollback (15+ minutes)
If issues are discovered later or planned rollback is needed:

1. **Git-based rollback**:
   ```bash
   # Identify commit to rollback to
   git log --oneline -10
   
   # Create rollback branch
   git checkout -b rollback-dual-comparison
   
   # Revert to previous working commit
   git revert <commit-hash>
   
   # Or reset to previous commit (if safe)
   git reset --hard <previous-commit-hash>
   
   # Rebuild and redeploy
   npm run build
   # Deploy as normal
   ```

2. **Database rollback** (if applicable):
   - No database changes in this feature
   - All data stored in localStorage (client-side)

### Communication Plan
During rollback:
1. **Internal team notification**:
   - Notify development team via Slack/Discord
   - Document issue in GitHub issues
   - Update status page if available

2. **User communication** (if necessary):
   - Post on social media if many users affected
   - Update website banner with maintenance notice
   - Email notification for critical issues

## Monitoring & Alerts

### Key Metrics to Monitor
- [ ] Page load times
- [ ] JavaScript error rates
- [ ] User engagement metrics
- [ ] Mobile vs desktop usage
- [ ] Browser compatibility issues

### Automated Monitoring
- [ ] Set up uptime monitoring (Pingdom, UptimeRobot, etc.)
- [ ] Configure error tracking (Sentry, LogRocket, etc.)
- [ ] Monitor Core Web Vitals
- [ ] Set up performance alerts

### Manual Monitoring Schedule
- **First 30 minutes**: Check every 5 minutes
- **First 2 hours**: Check every 15 minutes  
- **First 24 hours**: Check every hour
- **First week**: Check daily

## Hotfix Process

If critical bugs are found post-deployment:

1. **Assess severity**:
   - **Critical**: Breaks core functionality → Immediate rollback
   - **High**: Affects some users → Hotfix within 2 hours
   - **Medium**: Minor issues → Hotfix within 24 hours
   - **Low**: Cosmetic issues → Include in next release

2. **Hotfix development**:
   ```bash
   # Create hotfix branch from master
   git checkout -b hotfix/critical-issue
   
   # Make minimal fix
   # Test thoroughly
   npm run test:all
   
   # Commit and merge
   git commit -m "hotfix: fix critical calculation issue"
   git checkout master
   git merge hotfix/critical-issue
   
   # Deploy immediately
   ```

## Post-Deployment Tasks

### Immediate (within 24 hours)
- [ ] Monitor error rates and performance
- [ ] Check user feedback channels
- [ ] Verify analytics are working
- [ ] Document any issues found
- [ ] Update team on deployment status

### Short-term (within 1 week)
- [ ] Analyze user adoption of new feature
- [ ] Review performance metrics
- [ ] Collect user feedback
- [ ] Plan any necessary improvements
- [ ] Update documentation based on real usage

### Long-term (within 1 month)
- [ ] Conduct retrospective on deployment
- [ ] Update deployment process based on learnings
- [ ] Plan next feature release
- [ ] Archive deployment artifacts

## Emergency Contacts

### Technical Issues
- **Primary Developer**: [Your contact info]
- **DevOps/Infrastructure**: [DevOps contact]
- **Hosting Support**: [Hosting platform support]

### Business Issues
- **Product Owner**: [Contact info]
- **Customer Support**: [Support contact]

## Version Information

| Component | Version | Notes |
|-----------|---------|-------|
| Vue.js | 3.4.0 | Main framework |
| Vuex | 4.1.0 | State management |
| Vue Router | 4.2.0 | Routing |
| Node.js | 16+ | Build environment |
| npm | 8+ | Package manager |

## Rollback Testing

Before each deployment, ensure rollback procedures are tested:

1. **Test rollback in staging environment**
2. **Verify backup/restore procedures work**
3. **Practice emergency communication**
4. **Document any rollback procedure updates**

## Success Criteria

Deployment is considered successful when:
- [ ] All automated tests pass
- [ ] No critical errors in first 24 hours
- [ ] Performance metrics within acceptable range
- [ ] User feedback is positive or neutral
- [ ] Feature adoption rate meets expectations
- [ ] No rollback required within first week

---

**Last Updated**: [Date]  
**Version**: 1.0  
**Review Date**: [Date + 3 months]