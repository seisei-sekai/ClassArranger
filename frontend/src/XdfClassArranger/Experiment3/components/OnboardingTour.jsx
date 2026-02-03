/**
 * Onboarding Tour Component
 * 新手引导组件
 * 
 * Step-by-step guide for first-time users
 */

import React, { useState, useEffect } from 'react';
import './OnboardingTour.css';

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: '欢迎使用排课系统',
    content: 'Experiment3提供强大的AI辅助排课功能，让我们快速了解如何使用。',
    target: null,
    position: 'center'
  },
  {
    id: 'test-data',
    title: '第一步：生成测试数据',
    content: '点击「测试数据」按钮快速生成学生、教师和教室数据，方便学习系统功能。',
    target: '.test-data-btn',
    position: 'bottom'
  },
  {
    id: 'student-panel',
    title: '第二步：查看学生列表',
    content: '左侧是学生列表。点击任意学生卡片可以查看和编辑约束。',
    target: '.student-panel',
    position: 'right'
  },
  {
    id: 'ai-parse',
    title: '第三步：AI智能解析',
    content: '点击「AI解析」按钮，系统会自动识别学生的时间约束、偏好等信息。',
    target: '.ai-parse-btn',
    position: 'bottom'
  },
  {
    id: 'schedule',
    title: '第四步：一键排课',
    content: '点击右下角的「一键排课」按钮，系统会自动为所有学生安排课程。',
    target: '.floating-schedule-btn',
    position: 'left'
  },
  {
    id: 'calendar',
    title: '第五步：查看结果',
    content: '排课结果会显示在中间的日历视图中。您可以切换周视图和月视图。',
    target: '.calendar-wrapper',
    position: 'top'
  },
  {
    id: 'complete',
    title: '✅ 准备就绪！',
    content: '您已了解基本操作。现在可以开始使用真实数据进行排课了。如需帮助，点击右上角的「?」按钮。',
    target: null,
    position: 'center'
  }
];

const OnboardingTour = ({ onComplete, forceShow = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // If forceShow is true (from help button), always show
    // Otherwise check if user has seen the tour before
    if (forceShow) {
      setIsVisible(true);
    } else {
      const hasSeenTour = localStorage.getItem('xdf_has_seen_onboarding');
      if (!hasSeenTour) {
        setIsVisible(true);
      }
    }
  }, [forceShow]);

  useEffect(() => {
    if (!isVisible) return;

    const step = TOUR_STEPS[currentStep];
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        calculatePosition(rect, step.position);
      }
    } else {
      // Center position
      setPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
    }
  }, [currentStep, isVisible]);

  const calculatePosition = (rect, position) => {
    const cardWidth = 360;
    const cardHeight = 250;
    const padding = 20;
    
    let top, left;

    switch (position) {
      case 'top':
        top = rect.top - cardHeight - 20;
        left = rect.left + rect.width / 2 - cardWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + 20;
        left = rect.left + rect.width / 2 - cardWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - cardHeight / 2;
        left = rect.left - cardWidth - 20;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - cardHeight / 2;
        left = rect.right + 20;
        break;
      default:
        top = rect.top;
        left = rect.left;
    }

    // Boundary detection - keep card within viewport
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Horizontal boundary check
    if (left < padding) {
      left = padding;
    } else if (left + cardWidth > windowWidth - padding) {
      left = windowWidth - cardWidth - padding;
    }
    
    // Vertical boundary check
    if (top < padding) {
      top = padding;
    } else if (top + cardHeight > windowHeight - padding) {
      top = windowHeight - cardHeight - padding;
    }

    setPosition({ top: `${top}px`, left: `${left}px` });
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (window.confirm('确定要跳过新手引导吗？您随时可以点击「?」按钮重新查看。')) {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('xdf_has_seen_onboarding', 'true');
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="onboarding-overlay" />

      {/* Spotlight */}
      {step.target && (
        <div className="onboarding-spotlight" data-target={step.target} />
      )}

      {/* Tour Card */}
      <div 
        className={`onboarding-card ${step.position === 'center' ? 'centered' : ''}`}
        style={step.position === 'center' ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } : position}
      >
        <div className="card-header">
          <div className="step-indicator">
            步骤 {currentStep + 1} / {TOUR_STEPS.length}
          </div>
          <button className="btn-skip" onClick={handleSkip}>
            跳过
          </button>
        </div>

        <div className="card-body">
          <h3 className="step-title">{step.title}</h3>
          <p className="step-content">{step.content}</p>
        </div>

        <div className="card-footer">
          <button 
            className="btn-previous"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            上一步
          </button>
          
          <div className="progress-dots">
            {TOUR_STEPS.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </div>

          <button 
            className="btn-next"
            onClick={handleNext}
          >
            {currentStep === TOUR_STEPS.length - 1 ? '完成' : '下一步'}
          </button>
        </div>
      </div>
    </>
  );
};

/**
 * Help Button Component - Trigger tour anytime
 * 帮助按钮组件 - 随时触发引导
 */
export const HelpButton = ({ onClick }) => {
  return (
    <button className="help-button" onClick={onClick} title="查看新手引导">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  );
};

export default OnboardingTour;
