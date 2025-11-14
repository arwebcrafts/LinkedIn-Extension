/**
 * POST CREATOR COMPONENT
 * UI for creating lead magnet LinkedIn posts
 */

import React, { useState } from 'react';

interface PostCreatorProps {
  onClose: () => void;
}

const PostCreator: React.FC<PostCreatorProps> = ({ onClose }) => {
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [goal, setGoal] = useState<'engagement' | 'education' | 'inspiration' | 'lead_generation'>('lead_generation');
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_POST',
        topic,
        goal,
        targetAudience: targetAudience || undefined,
      });

      if (response.post) {
        setGeneratedPost(response.post);
      } else {
        setError('Failed to generate post. Please try again.');
      }
    } catch (err) {
      setError('Error generating post. Check your OpenAI API key configuration.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPost);
    alert('Post copied to clipboard! ✅');
  };

  const handleOpenLinkedIn = () => {
    window.open('https://www.linkedin.com/feed/', '_blank');
  };

  return (
    <div className="post-creator-overlay">
      <div className="post-creator-modal">
        <div className="modal-header">
          <h2>✨ Create Lead Magnet Post</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-content">
          {!generatedPost ? (
            // Input Form
            <div className="post-form">
              <div className="form-group">
                <label>What topic do you want to write about?</label>
                <textarea
                  placeholder="E.g., 'How I grew my LinkedIn following from 0 to 10k in 6 months' or 'The biggest mistake most entrepreneurs make with email marketing'"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={4}
                  className="topic-input"
                />
              </div>

              <div className="form-group">
                <label>Goal</label>
                <select value={goal} onChange={(e) => setGoal(e.target.value as any)} className="goal-select">
                  <option value="lead_generation">🎯 Lead Generation (Drive connections & DMs)</option>
                  <option value="engagement">💬 Engagement (Spark discussion)</option>
                  <option value="education">📚 Education (Teach something)</option>
                  <option value="inspiration">✨ Inspiration (Motivate & inspire)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Target Audience (Optional)</label>
                <input
                  type="text"
                  placeholder="E.g., 'B2B founders', 'Marketing managers', 'SaaS entrepreneurs'"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="audience-input"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-generate"
              >
                {isGenerating ? '✨ Generating Amazing Content...' : '🚀 Generate Post'}
              </button>

              <div className="tips">
                <strong>💡 Tips for best results:</strong>
                <ul>
                  <li>Be specific about your topic</li>
                  <li>Include numbers or outcomes when possible</li>
                  <li>Think about what would make YOU stop scrolling</li>
                </ul>
              </div>
            </div>
          ) : (
            // Generated Post Display
            <div className="post-result">
              <div className="result-header">
                <h3>Your Lead Magnet Post ✨</h3>
                <button onClick={() => setGeneratedPost('')} className="btn-secondary-sm">
                  Generate New Post
                </button>
              </div>

              <div className="post-preview">
                {generatedPost}
              </div>

              <div className="post-stats">
                <div className="stat">
                  <span className="label">Words:</span>
                  <span className="value">{generatedPost.split(/\s+/).length}</span>
                </div>
                <div className="stat">
                  <span className="label">Characters:</span>
                  <span className="value">{generatedPost.length}</span>
                </div>
                <div className="stat">
                  <span className="label">Estimated reading time:</span>
                  <span className="value">{Math.ceil(generatedPost.split(/\s+/).length / 200)}min</span>
                </div>
              </div>

              <div className="action-buttons">
                <button onClick={handleCopy} className="btn-primary">
                  📋 Copy to Clipboard
                </button>
                <button onClick={handleOpenLinkedIn} className="btn-secondary">
                  ➡️ Open LinkedIn
                </button>
              </div>

              <div className="engagement-tips">
                <strong>🎯 Engagement Tips:</strong>
                <ul>
                  <li>Post between 8-10am or 12-1pm for best visibility</li>
                  <li>Respond to comments within first hour</li>
                  <li>Share in relevant LinkedIn groups</li>
                  <li>Tag relevant people (max 3-5)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCreator;
