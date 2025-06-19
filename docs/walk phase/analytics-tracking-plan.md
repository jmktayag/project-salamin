# Analytics Tracking Plan for Walk Phase Testing

## Overview

This document outlines the key metrics and simple tracking approach for Salamin's walk phase user testing. The focus is on measuring user behavior, technical performance, and validation success without implementing complex analytics infrastructure.

## Key Success Metrics

### Primary Validation Metrics

#### 1. Session Completion Rate
**Definition:** Percentage of users who complete the full interview flow (configuration → questions → feedback → summary)

**Target:** 80%+ completion rate
**Tracking Method:** Simple event logging in browser console/localStorage
**Implementation:** Track events: `session_started`, `question_completed`, `interview_finished`

#### 2. User Satisfaction Score
**Definition:** Average rating from post-interview survey (1-10 scale)

**Target:** 7.0+ average satisfaction
**Tracking Method:** Survey responses aggregated manually
**Implementation:** Google Forms with automatic response compilation

#### 3. Net Promoter Score (NPS)
**Definition:** Standard NPS calculation from likelihood to recommend (0-10 scale)

**Target:** +20 or higher NPS
**Tracking Method:** Survey question analysis
**Implementation:** Calculate % Promoters (9-10) minus % Detractors (0-6)

### Secondary Performance Metrics

#### 4. Time to Complete Interview
**Definition:** Average time from start to finish of full interview session

**Target:** 15-25 minutes for 5-question interview
**Tracking Method:** Browser timestamp logging
**Implementation:** Store `start_time` and `end_time` in localStorage

#### 5. Feature Adoption Rates
**Definition:** Percentage of users who engage with key features

**Targets:**
- Text-to-Speech usage: 60%+
- Speech Recognition attempts: 40%+
- Feedback review completion: 90%+

**Tracking Method:** Feature interaction logging
**Implementation:** Track clicks on TTS button, microphone usage, feedback scrolling

#### 6. Technical Error Rate
**Definition:** Percentage of sessions experiencing technical issues

**Target:** <5% of sessions have blocking technical errors
**Tracking Method:** Error logging and user feedback
**Implementation:** Console error tracking + survey responses

## Simple Implementation Approach

### Phase 1: Browser-Based Tracking (Week 1-2)

#### LocalStorage Event Logging
```javascript
// Simple event tracking function
function trackEvent(eventName, data = {}) {
  const events = JSON.parse(localStorage.getItem('salamin_events') || '[]');
  events.push({
    event: eventName,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    ...data
  });
  localStorage.setItem('salamin_events', JSON.stringify(events));
  
  // Also log to console for development
  console.log('Event tracked:', eventName, data);
}

// Usage examples:
trackEvent('session_started', { interviewType: 'behavioral', position: 'Software Engineer' });
trackEvent('question_answered', { questionIndex: 1, timeSpent: 45000 });
trackEvent('feature_used', { feature: 'text_to_speech' });
trackEvent('session_completed', { totalQuestions: 5, totalTime: 1200000 });
```

#### Key Events to Track
- `session_started` - User begins interview
- `question_displayed` - Each new question shown
- `question_answered` - User submits answer
- `feedback_generated` - AI feedback received
- `feature_used` - TTS, speech recognition, etc.
- `session_completed` - Full interview finished
- `session_abandoned` - User leaves without completing
- `error_occurred` - Technical errors

### Phase 2: Enhanced Tracking (Week 3-4)

#### Google Analytics 4 (Optional)
If needed for more detailed insights:
- Custom events for key user actions
- Funnel analysis for drop-off points
- User flow visualization
- Real-time dashboard for testing sessions

#### Implementation Considerations
- GDPR compliance for any analytics
- User consent for data collection
- Anonymous/pseudonymous data only
- Easy opt-out mechanisms

## Data Collection Points

### Automatic Tracking (No User Action Required)

#### 1. Session Flow Metrics
- **Start time:** When user begins interview
- **Question progression:** Time between questions
- **Answer submission time:** Time spent on each answer
- **Feature interactions:** TTS plays, microphone usage
- **Completion time:** Total session duration
- **Drop-off points:** Where users abandon sessions

#### 2. Technical Performance
- **Loading times:** Question generation speed
- **Error occurrences:** API failures, UI errors
- **Browser compatibility:** User agent, device info
- **Feature availability:** Speech API support, etc.

### Manual Collection (Survey-Based)

#### 3. User Experience Metrics
- **Satisfaction ratings:** Overall experience quality
- **Perceived value:** What users found most valuable
- **Improvement suggestions:** Priority enhancement areas
- **Likelihood to recommend:** NPS calculation
- **Usage context:** When/where they'd use the tool

#### 4. Demographic Segmentation
- **Career stage:** Recent grad, career changer, experienced
- **Interview experience:** Number of recent interviews
- **Industry background:** Tech, finance, healthcare, etc.
- **Job search status:** Actively searching, passive, etc.

## Success Criteria Thresholds

### Week 1-2 Targets (Initial Validation)
- **Completion Rate:** 70%+ (acceptable for first iteration)
- **Satisfaction Score:** 6.5+ average (room for improvement)
- **Technical Issues:** <10% of sessions affected
- **Survey Response Rate:** 60%+ of participants respond

### Week 3-4 Targets (Iteration Validation)
- **Completion Rate:** 80%+ (improved from feedback)
- **Satisfaction Score:** 7.0+ average (meeting target)
- **Technical Issues:** <5% of sessions affected
- **NPS Score:** +10 or higher (basic advocacy)

### Walk Phase Success Criteria
- **Completion Rate:** 80%+ sustained over multiple weeks
- **Satisfaction Score:** 7.0+ average with improving trend
- **Net Promoter Score:** +20 or higher
- **Technical Stability:** <5% error rate
- **Repeat Usage:** 30%+ return for second session

## Data Analysis Framework

### Daily Monitoring (During Testing Weeks)
- **Session count:** Number of new sessions started
- **Completion tracking:** How many reached the end
- **Error monitoring:** Any technical issues reported
- **Feature usage:** Which features are being adopted

### Weekly Analysis
- **Completion funnel:** Where users drop off in the flow
- **Feature adoption:** Usage rates for TTS, speech recognition
- **Performance trends:** Are metrics improving over time?
- **User feedback themes:** Common feedback patterns

### Post-Phase Analysis
- **Success criteria assessment:** Did we meet walk phase targets?
- **User segmentation:** Which personas had best/worst experience?
- **Feature prioritization:** Which features drive satisfaction?
- **Technical priorities:** Most critical bugs/improvements needed

## Simple Dashboard Creation

### Google Sheets Analytics Dashboard
Create a simple dashboard using Google Sheets:

#### Sheet 1: Session Overview
- Date, Session ID, User Type, Completion Status, Duration
- Auto-calculate completion rates and averages
- Simple charts for trend visualization

#### Sheet 2: Feature Usage
- Feature name, Usage count, Adoption rate
- Compare feature popularity across user segments

#### Sheet 3: Survey Results
- Response ID, Satisfaction, NPS, Technical Issues, Comments
- Automatic NPS calculation and satisfaction averaging

#### Sheet 4: Issue Tracking
- Error type, Frequency, User impact, Resolution status
- Priority ranking based on frequency and severity

## Privacy and Compliance

### Data Minimization
- Collect only necessary data for validation
- No personally identifiable information in analytics
- Anonymous session IDs only
- Auto-delete data after analysis period

### User Consent
- Clear opt-in for analytics tracking
- Separate consent for interview recording
- Easy opt-out at any time
- Transparent data usage explanation

### GDPR Compliance
- Lawful basis for processing (consent)
- Right to access collected data
- Right to deletion of personal data
- Data retention policy (30-90 days max)

## Implementation Timeline

### Week 0: Setup
- **Days 1-2:** Implement basic event tracking
- **Days 3-4:** Create data collection dashboard
- **Days 5-7:** Test tracking with internal sessions

### Week 1: Initial Testing
- **Days 1-3:** Monitor daily metrics and technical issues
- **Days 4-7:** Collect survey responses and analyze trends

### Week 2: Analysis and Iteration
- **Days 1-3:** Compile week 1 findings and improvements
- **Days 4-7:** Continue monitoring with any implemented fixes

### Week 3: Decision Point
- **Days 1-7:** Final data collection and comprehensive analysis
- **End of week:** Assess against success criteria for walk phase progression

This analytics approach provides essential insights for walk phase validation while remaining simple to implement and maintain, ensuring we can make data-driven decisions about progressing to the run phase.