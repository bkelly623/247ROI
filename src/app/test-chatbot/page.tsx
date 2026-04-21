'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function TestChatbotContent() {
  const searchParams = useSearchParams();
  const botId = searchParams.get('id') || 'bot_1763168641649_u788ur7zg';

  useEffect(() => {
    // Load the embed script
    const script = document.createElement('script');
    // TODO: point to your 247ROI embed when deployed; legacy URL kept for local testing
    script.src = `https://automagixx-chatbot-server.vercel.app/embed.js?id=${botId}`;
    script.async = true;
    document.body.appendChild(script);
    
    // Cleanup
    return () => {
      script.remove();
      const container = document.getElementById("automagixx-chat-container");
      if (container) container.remove();
    };
  }, [botId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold mb-4">Chatbot Test Page</h1>
          <p className="text-gray-600 mb-4">
            Testing chatbot ID: <code className="bg-gray-100 px-2 py-1 rounded">{botId}</code>
          </p>
          <p className="text-sm text-gray-500">
            To test a different chatbot, add <code className="bg-gray-100 px-2 py-1 rounded">?id=CHATBOT_ID</code> to the URL
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Sample Content</h2>
          <p className="text-gray-700 mb-4">
            This is a test page to preview how the chatbot will look on a real website. 
            The floating chatbot button should appear in the bottom-right corner.
          </p>
          <p className="text-gray-700 mb-4">
            Click the button to open the chat widget and test the chatbot functionality.
          </p>
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 mb-4">
            <p className="text-emerald-700 font-semibold">Pro Tip:</p>
            <p className="text-emerald-600 text-sm">
              You can use this page to demo chatbots to potential clients or test new configurations before deployment.
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            <h3 className="text-xl font-semibold">Sample Questions to Test:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>What are your room prices?</li>
              <li>Do you have private rooms?</li>
              <li>What time is check-in?</li>
              <li>What amenities do you offer?</li>
              <li>Is parking available?</li>
              <li>Do you allow pets?</li>
              <li>What is your cancellation policy?</li>
              <li>Do you offer free Wi-Fi?</li>
              <li>Are there any nearby attractions?</li>
              <li>Can I make a special request?</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestChatbotPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <TestChatbotContent />
    </Suspense>
  );
}