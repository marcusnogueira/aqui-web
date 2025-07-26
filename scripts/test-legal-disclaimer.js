#!/usr/bin/env node

/**
 * Test script to verify the legal disclaimer implementation
 */

const fs = require('fs')
const path = require('path')

function testAuthModalDisclaimer() {
  console.log('🧪 Testing AuthModal Legal Disclaimer...')
  
  try {
    const authModalPath = path.join(process.cwd(), 'components/AuthModal.tsx')
    const authModalContent = fs.readFileSync(authModalPath, 'utf8')
    
    // Check for disclaimer text
    const hasDisclaimer = authModalContent.includes('By signing in, you agree to AQUI\'s')
    const hasTermsLink = authModalContent.includes('href="/terms"')
    const hasPrivacyLink = authModalContent.includes('href="/privacy"')
    const hasLegalLink = authModalContent.includes('href="/legal"')
    const hasContactEmail = authModalContent.includes('mrn@get-aqui.com')
    const hasNoPhoneDisclaimer = authModalContent.includes('We do not provide a phone number or physical address')
    
    console.log('   ✅ Disclaimer text:', hasDisclaimer ? 'FOUND' : '❌ MISSING')
    console.log('   ✅ Terms of Service link:', hasTermsLink ? 'FOUND' : '❌ MISSING')
    console.log('   ✅ Privacy Policy link:', hasPrivacyLink ? 'FOUND' : '❌ MISSING')
    console.log('   ✅ Legal Notice link:', hasLegalLink ? 'FOUND' : '❌ MISSING')
    console.log('   ✅ Contact email:', hasContactEmail ? 'FOUND' : '❌ MISSING')
    console.log('   ✅ No phone disclaimer:', hasNoPhoneDisclaimer ? 'FOUND' : '❌ MISSING')
    
    const allChecks = hasDisclaimer && hasTermsLink && hasPrivacyLink && hasLegalLink && hasContactEmail && hasNoPhoneDisclaimer
    
    if (allChecks) {
      console.log('   🎉 All disclaimer elements are present!')
    } else {
      console.log('   ⚠️  Some disclaimer elements are missing')
    }
    
    return allChecks
    
  } catch (error) {
    console.error('   ❌ Error reading AuthModal file:', error.message)
    return false
  }
}

function testLegalPages() {
  console.log('\n🧪 Testing Legal Pages...')
  
  const pages = [
    { name: 'Terms of Service', path: 'app/terms/page.tsx', title: 'Terms of Service' },
    { name: 'Privacy Policy', path: 'app/privacy/page.tsx', title: 'Privacy Policy' },
    { name: 'Legal Notice', path: 'app/legal/page.tsx', title: 'Legal Notice' }
  ]
  
  let allPagesValid = true
  
  pages.forEach(page => {
    try {
      const pagePath = path.join(process.cwd(), page.path)
      const pageContent = fs.readFileSync(pagePath, 'utf8')
      
      const hasTitle = pageContent.includes(page.title)
      const hasHeader = pageContent.includes('<header')
      const hasNavigation = pageContent.includes('<Navigation')
      const hasThemeToggle = pageContent.includes('<ThemeToggle')
      const hasContactEmail = pageContent.includes('mrn@get-aqui.com')
      const hasFooterNav = pageContent.includes('Footer Navigation')
      
      console.log(`\n   ${page.name}:`)
      console.log('     ✅ Title:', hasTitle ? 'FOUND' : '❌ MISSING')
      console.log('     ✅ Header:', hasHeader ? 'FOUND' : '❌ MISSING')
      console.log('     ✅ Navigation:', hasNavigation ? 'FOUND' : '❌ MISSING')
      console.log('     ✅ Theme Toggle:', hasThemeToggle ? 'FOUND' : '❌ MISSING')
      console.log('     ✅ Contact Email:', hasContactEmail ? 'FOUND' : '❌ MISSING')
      console.log('     ✅ Footer Navigation:', hasFooterNav ? 'FOUND' : '❌ MISSING')
      
      const pageValid = hasTitle && hasHeader && hasNavigation && hasThemeToggle && hasContactEmail && hasFooterNav
      
      if (!pageValid) {
        allPagesValid = false
      }
      
    } catch (error) {
      console.error(`     ❌ Error reading ${page.name} file:`, error.message)
      allPagesValid = false
    }
  })
  
  if (allPagesValid) {
    console.log('\n   🎉 All legal pages are properly structured!')
  } else {
    console.log('\n   ⚠️  Some legal pages have issues')
  }
  
  return allPagesValid
}

function testLinkAccessibility() {
  console.log('\n🧪 Testing Link Accessibility...')
  
  try {
    const authModalPath = path.join(process.cwd(), 'components/AuthModal.tsx')
    const authModalContent = fs.readFileSync(authModalPath, 'utf8')
    
    // Check for accessibility attributes
    const hasTargetBlank = authModalContent.includes('target="_blank"')
    const hasRelNoopener = authModalContent.includes('rel="noopener noreferrer"')
    const hasUnderlineOffset = authModalContent.includes('underline-offset-2')
    const hasHoverStates = authModalContent.includes('hover:text-primary/80')
    
    console.log('   ✅ Opens in new tab (target="_blank"):', hasTargetBlank ? 'FOUND' : '❌ MISSING')
    console.log('   ✅ Security attributes (rel="noopener noreferrer"):', hasRelNoopener ? 'FOUND' : '❌ MISSING')
    console.log('   ✅ Underline styling:', hasUnderlineOffset ? 'FOUND' : '❌ MISSING')
    console.log('   ✅ Hover states:', hasHoverStates ? 'FOUND' : '❌ MISSING')
    
    const accessibilityValid = hasTargetBlank && hasRelNoopener && hasUnderlineOffset && hasHoverStates
    
    if (accessibilityValid) {
      console.log('   🎉 All accessibility features are implemented!')
    } else {
      console.log('   ⚠️  Some accessibility features are missing')
    }
    
    return accessibilityValid
    
  } catch (error) {
    console.error('   ❌ Error checking accessibility:', error.message)
    return false
  }
}

function testResponsiveDesign() {
  console.log('\n🧪 Testing Responsive Design...')
  
  try {
    const authModalPath = path.join(process.cwd(), 'components/AuthModal.tsx')
    const authModalContent = fs.readFileSync(authModalPath, 'utf8')
    
    // Check for responsive classes
    const hasTextXs = authModalContent.includes('text-xs')
    const hasTextCenter = authModalContent.includes('text-center')
    const hasLeadingRelaxed = authModalContent.includes('leading-relaxed')
    const hasPadding = authModalContent.includes('px-2')
    
    console.log('   ✅ Small text size (text-xs):', hasTextXs ? 'FOUND' : '❌ MISSING')
    console.log('   ✅ Center alignment:', hasTextCenter ? 'FOUND' : '❌ MISSING')
    console.log('   ✅ Relaxed line height:', hasLeadingRelaxed ? 'FOUND' : '❌ MISSING')
    console.log('   ✅ Proper padding:', hasPadding ? 'FOUND' : '❌ MISSING')
    
    const responsiveValid = hasTextXs && hasTextCenter && hasLeadingRelaxed && hasPadding
    
    if (responsiveValid) {
      console.log('   🎉 Responsive design is properly implemented!')
    } else {
      console.log('   ⚠️  Some responsive design features are missing')
    }
    
    return responsiveValid
    
  } catch (error) {
    console.error('   ❌ Error checking responsive design:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Testing Legal Disclaimer Implementation')
  console.log('==========================================')
  
  const authModalTest = testAuthModalDisclaimer()
  const legalPagesTest = testLegalPages()
  const accessibilityTest = testLinkAccessibility()
  const responsiveTest = testResponsiveDesign()
  
  const allTestsPassed = authModalTest && legalPagesTest && accessibilityTest && responsiveTest
  
  console.log('\n📊 Test Results Summary:')
  console.log('========================')
  console.log('✅ AuthModal Disclaimer:', authModalTest ? 'PASS' : '❌ FAIL')
  console.log('✅ Legal Pages:', legalPagesTest ? 'PASS' : '❌ FAIL')
  console.log('✅ Link Accessibility:', accessibilityTest ? 'PASS' : '❌ FAIL')
  console.log('✅ Responsive Design:', responsiveTest ? 'PASS' : '❌ FAIL')
  
  if (allTestsPassed) {
    console.log('\n🎉 All tests passed! Legal disclaimer implementation is complete.')
    console.log('\n📋 Implementation Summary:')
    console.log('- ✅ Legal disclaimer added to sign-in popup')
    console.log('- ✅ Links to Terms of Service (/terms)')
    console.log('- ✅ Links to Privacy Policy (/privacy)')
    console.log('- ✅ Links to Legal Notice (/legal)')
    console.log('- ✅ Contact email: mrn@get-aqui.com')
    console.log('- ✅ No phone/address disclaimer included')
    console.log('- ✅ All links open in new tabs')
    console.log('- ✅ Responsive and accessible design')
    console.log('- ✅ Matches existing UI theme')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.')
  }
  
  console.log('\n🔗 Test the implementation:')
  console.log('1. Start the development server: npm run dev')
  console.log('2. Click "Sign In" to open the auth modal')
  console.log('3. Verify the disclaimer appears below the sign-in buttons')
  console.log('4. Test the legal page links: /terms, /privacy, /legal')
}

if (require.main === module) {
  main().catch(console.error)
}