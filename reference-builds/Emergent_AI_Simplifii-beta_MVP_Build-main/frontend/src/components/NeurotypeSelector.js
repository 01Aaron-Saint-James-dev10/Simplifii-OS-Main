import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Brain, Zap, Eye, Heart, Puzzle, X } from 'lucide-react';

const NeurotypeSelector = ({ onClose }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [saving, setSaving] = useState(false);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  const neurotypes = [
    {
      id: 'adhd',
      name: 'ADHD Brain',
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      description: 'Hyperfocus mode, gamified progress, dopamine-hit micro-rewards',
      preferences: {
        showOneTaskAtTime: true,
        gamification: true,
        frequentBreaks: true,
        visualProgress: true,
        colorCoding: 'vibrant'
      }
    },
    {
      id: 'dyslexic',
      name: 'Dyslexic Brain',
      icon: Eye,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      description: 'OpenDyslexic font always on, color overlays, text-to-speech default',
      preferences: {
        font: 'OpenDyslexic',
        lineHeight: 1.8,
        letterSpacing: '0.05em',
        backgroundColor: '#FEFCE8',
        ttsAutoplay: true
      }
    },
    {
      id: 'autistic',
      name: 'Autistic Brain',
      icon: Puzzle,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      description: 'Predictable structure, clear rules & patterns, no ambiguity',
      preferences: {
        consistentLayout: true,
        explicitInstructions: true,
        noAmbiguity: true,
        structuredData: true,
        minimalSurprises: true
      }
    },
    {
      id: 'anxious',
      name: 'Anxious Brain',
      icon: Heart,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
      description: 'No red urgency colors, reassurance prompts, "Plenty of time" framing',
      preferences: {
        hideDeadlineWarnings: true,
        reassuranceMessages: true,
        calmColors: true,
        positiveFraming: true,
        stressReduction: true
      }
    },
    {
      id: 'multiple',
      name: 'Multiple / Not Sure',
      icon: Brain,
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-300',
      description: 'Adaptive learning - AI personalizes over time based on your usage',
      preferences: {
        adaptive: true,
        learnFromBehavior: true,
        multiModal: true
      }
    }
  ];

  const handleSelect = async (neurotype) => {
    setSaving(true);
    try {
      await axios.post(`${API}/user/neurotype`, {
        neurotype: neurotype.id,
        preferences: neurotype.preferences
      }, { withCredentials: true });

      setSelectedType(neurotype.id);
      
      // Apply preferences immediately to document
      applyPreferences(neurotype.preferences);
      
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Failed to save neurotype:', error);
    } finally {
      setSaving(false);
    }
  };

  const applyPreferences = (prefs) => {
    if (prefs.font === 'OpenDyslexic') {
      document.body.classList.add('dyslexia-font');
    }
    if (prefs.backgroundColor) {
      document.body.style.backgroundColor = prefs.backgroundColor;
    }
    // Store in localStorage for persistence
    localStorage.setItem('simplifii_preferences', JSON.stringify(prefs));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Outfit' }}>
              How does your brain work best?
            </h2>
            <p className="text-gray-600">
              Choose your neurotype for a personalized experience designed for you
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {neurotypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;

            return (
              <button
                key={type.id}
                onClick={() => handleSelect(type)}
                disabled={saving}
                className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                  isSelected
                    ? `${type.borderColor} ${type.bgColor} shadow-lg`
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } disabled:opacity-50`}
                data-testid={`neurotype-${type.id}`}
              >
                <div className="flex items-start gap-4 mb-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Outfit' }}>
                      {type.name}
                    </h3>
                    {isSelected && (
                      <span className="inline-block px-2 py-1 bg-[#007C8C] text-white text-xs rounded-full">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> You can change this anytime in Settings. Your preferences are saved and applied across all tools.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NeurotypeSelector;
