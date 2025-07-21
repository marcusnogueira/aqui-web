'use client'

import { useEffect, useState } from 'react'

export default function TestAuthPage() {
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [...prev, message])
  }

  const runTests = async () => {
    setResults([])
    addResult('=== TESTING NEXTAUTH ===')

    // Test 1: NextAuth session endpoint
    try {
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()
      addResult(`✅ NextAuth session endpoint works: ${JSON.stringify(sessionData)}`)
    } catch (err) {
      addResult(`❌ NextAuth session endpoint failed: ${err}`)
    }

    // Test 2: NextAuth providers endpoint
    try {
      const providersRes = await fetch('/api/auth/providers')
      const providersData = await providersRes.json()
      addResult(`✅ NextAuth providers: ${Object.keys(providersData).join(', ')}`)
    } catch (err) {
      addResult(`❌ NextAuth providers failed: ${err}`)
    }

    // Test 3: Check browser storage
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('auth')
    )
    addResult(`🔍 Browser storage auth keys: ${supabaseKeys.join(', ') || 'none'}`)

    // Test 4: Registration test
    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test-${Date.now()}@example.com`,
          password: 'testpass123'
        })
      })
      const regData = await regRes.json()
      addResult(`📝 Registration test (${regRes.status}): ${JSON.stringify(regData)}`)
    } catch (err) {
      addResult(`❌ Registration failed: ${err}`)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">NextAuth Test Results</h1>
      
      <button 
        onClick={runTests}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Run Tests Again
      </button>

      <div className="bg-gray-100 p-4 rounded-lg">
        <pre className="whitespace-pre-wrap text-sm">
          {results.map((result, i) => (
            <div key={i} className="mb-1">{result}</div>
          ))}
        </pre>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Manual Tests</h2>
        <p className="mb-4">Now go back to the homepage and:</p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Click the "Sign In" button</li>
          <li>Tell me what modal/page appears</li>
          <li>Try clicking "Continue with Google" if you see it</li>
          <li>Tell me what happens</li>
        </ol>
      </div>
    </div>
  )
}