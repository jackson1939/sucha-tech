'use client';

import React from 'react';
import { ProjectSubmissionForm } from '@frontend/components/ProjectSubmissionForm';
import { AnimatedBackground } from '@frontend/components/AnimatedBackground';

export default function SubmitPage() {
  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
              Submit Your Project
            </h1>
            <p className="text-lg text-gray-400">
              Share your innovation with the Solana community.
            </p>
          </header>
          
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <ProjectSubmissionForm />
          </div>
          
          <footer className="mt-12 text-center text-gray-500 text-sm">
            <p>© 2024 Vibe Broker · Solana Hackathon Edition</p>
          </footer>
        </div>
      </div>
    </>
  );
}
