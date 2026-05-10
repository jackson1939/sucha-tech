'use client';

import React, { useState, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface Track {
  id: string;
  name: string;
}

const TRACKS: Track[] = [
  { id: 'lifi', name: 'LI.FI' },
  { id: 'virtuals', name: 'Virtuals' },
  { id: 'solana-mobile', name: 'Solana Mobile' },
  { id: 'eleven-labs', name: 'Eleven Labs' },
];

const CATEGORIES = [
  'DeFi',
  'Payments',
  'DAOs',
  'NFTs',
  'Gaming',
  'AI',
  'Mobile',
  'Infrastructure',
];

const LOCAL_HUBS = [
  'Santa Cruz — Santa Cruz, Bolivia',
  'Mexico City — Mexico',
  'Buenos Aires — Argentina',
  'Madrid — Spain',
];

export const ProjectSubmissionForm: React.FC = () => {
  const [formData, setFormData] = useState({
    oneLiner: '',
    partnerTracks: [] as string[],
    category: '',
    smartContract: '',
    localHub: 'Santa Cruz — Santa Cruz, Bolivia',
    description: '',
  });

  const [errors, setErrors] = useState({
    oneLiner: false,
    description: false,
  });

  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.form-section', {
      y: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out',
    });
  }, { scope: containerRef });

  const toggleTrack = (trackId: string) => {
    setFormData((prev) => {
      const isSelected = prev.partnerTracks.includes(trackId);
      if (isSelected) {
        return {
          ...prev,
          partnerTracks: prev.partnerTracks.filter((id) => id !== trackId),
        };
      } else {
        return {
          ...prev,
          partnerTracks: [...prev.partnerTracks, trackId],
        };
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error if user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = {
      oneLiner: !formData.oneLiner.trim(),
      description: !formData.description.trim(),
    };

    setErrors(newErrors);

    if (!newErrors.oneLiner && !newErrors.description) {
      console.log('Submitting Project:', formData);
      // Logic for submission here
      alert('Project Submitted Successfully!');
    }
  };

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto p-6 space-y-8 bg-transparent text-white">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* One-liner */}
        <div className="form-section space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-gray-200">
              One-liner *
            </label>
            <span className="text-[10px] text-gray-500">
              {formData.oneLiner.length}/50
            </span>
          </div>
          <input
            name="oneLiner"
            value={formData.oneLiner}
            onChange={handleChange}
            placeholder="In one sentence, what does your project do?"
            className={`input-base ${errors.oneLiner ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            maxLength={50}
          />
          {errors.oneLiner && (
            <p className="text-xs text-red-500 mt-1">One-liner is required.</p>
          )}
        </div>

        {/* Partner Tracks */}
        <div className="form-section space-y-3">
          <label className="text-sm font-semibold text-gray-200 block">
            Are you also submitting for a partner track? <span className="font-normal text-gray-500">(optional — all projects are on Solana)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {TRACKS.map((track) => {
              const isSelected = formData.partnerTracks.includes(track.id);
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => toggleTrack(track.id)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 border ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 text-purple-100 shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {track.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category */}
        <div className="form-section space-y-2">
          <label className="text-sm font-semibold text-gray-200 block">
            What category does your project belong to? <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <div className="relative">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-base appearance-none cursor-pointer"
            >
              <option value="" disabled>Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Smart Contract */}
        <div className="form-section space-y-2">
          <label className="text-sm font-semibold text-gray-200 block">
            Smart Contract / Program Address <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <input
            name="smartContract"
            value={formData.smartContract}
            onChange={handleChange}
            placeholder="e.g. 9xQeWvG..."
            className="input-base"
          />
          <p className="text-[10px] text-gray-500">Mainnet or devnet address accepted.</p>
        </div>

        {/* Local Hub */}
        <div className="form-section space-y-2">
          <label className="text-sm font-semibold text-gray-200 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Submitting from a local hub? <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <div className="relative">
            <select
              name="localHub"
              value={formData.localHub}
              onChange={handleChange}
              className="input-base appearance-none cursor-pointer"
            >
              {LOCAL_HUBS.map((hub) => (
                <option key={hub} value={hub}>{hub}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-gray-500">Hacking in person? Pick your city hub.</p>
        </div>

        {/* Description */}
        <div className="form-section space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-gray-200">
              Description *
            </label>
            <span className="text-[10px] text-gray-500">
              {formData.description.length}/120
            </span>
          </div>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your project, problem solved, and how it works..."
            className={`input-base min-h-[120px] resize-none ${errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            maxLength={120}
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-1">Description is required.</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-purple-500/25 active:scale-[0.98]"
        >
          Submit Project
        </button>

      </form>

      <style jsx>{`
        .input-base {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px 18px;
          color: #f0f0fa;
          font-size: 15px;
          transition: all 200ms;
        }
        .input-base:focus {
          outline: none;
          border-color: #7c3aed;
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }
        .input-base::placeholder {
          color: #4a4a6a;
        }
      `}</style>
    </div>
  );
};
