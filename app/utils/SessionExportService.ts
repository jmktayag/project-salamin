import { InterviewSession } from '../types/session';

export class SessionExportService {
  /**
   * Export session data as JSON file
   */
  static exportAsJSON(session: InterviewSession): void {
    try {
      const exportData = {
        ...session,
        exportedAt: new Date().toISOString(),
        exportFormat: 'json'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-session-${session.position.replace(/\s+/g, '-').toLowerCase()}-${new Date(session.startedAt).toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export session as JSON:', error);
      throw new Error('Failed to export session');
    }
  }

  /**
   * Export session data as formatted text
   */
  static exportAsText(session: InterviewSession): void {
    try {
      const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      const formatDuration = (seconds?: number) => {
        if (!seconds) return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        if (hours > 0) {
          return `${hours}h ${minutes}m ${remainingSeconds}s`;
        }
        return `${minutes}m ${remainingSeconds}s`;
      };

      let content = `INTERVIEW SESSION REPORT\n`;
      content += `===========================\n\n`;
      
      content += `Position: ${session.position}\n`;
      content += `Interview Type: ${session.interviewType}\n`;
      content += `Status: ${session.status}\n`;
      content += `Started: ${formatDate(session.startedAt)}\n`;
      
      if (session.completedAt) {
        content += `Completed: ${formatDate(session.completedAt)}\n`;
      }
      
      content += `Duration: ${formatDuration(session.duration)}\n`;
      content += `Questions Answered: ${session.questionsAnswered}/${session.totalQuestions}\n\n`;

      if (session.analysis) {
        content += `INTERVIEW ANALYSIS\n`;
        content += `==================\n\n`;
        content += `Overall Score: ${session.analysis.overallScore}%\n`;
        content += `Hiring Verdict: ${session.analysis.hiringVerdict.replace('_', ' ')}\n\n`;
        
        content += `Strengths:\n`;
        session.analysis.strengths.forEach(strength => {
          content += `• ${strength}\n`;
        });
        content += `\n`;
        
        content += `Areas for Improvement:\n`;
        session.analysis.weaknesses.forEach(weakness => {
          content += `• ${weakness}\n`;
        });
        content += `\n`;
        
        content += `Recommendations:\n`;
        session.analysis.recommendations.forEach(recommendation => {
          content += `• ${recommendation}\n`;
        });
        content += `\n`;
        
        content += `Detailed Feedback:\n`;
        content += `${session.analysis.detailedFeedback}\n\n`;
      }

      content += `QUESTIONS AND RESPONSES\n`;
      content += `=======================\n\n`;

      session.questions.forEach((q, index) => {
        content += `Question ${index + 1} (${q.category} - ${q.difficulty}):\n`;
        content += `${q.question}\n\n`;
        content += `Your Response:\n`;
        content += `${q.userResponse}\n\n`;
        
        if (q.feedback && q.feedback.length > 0) {
          content += `AI Feedback:\n`;
          q.feedback.forEach(feedback => {
            content += `[${feedback.type.toUpperCase()}] ${feedback.text}\n`;
          });
        }
        content += `\n---\n\n`;
      });

      content += `\nExported on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n`;

      const dataBlob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-session-${session.position.replace(/\s+/g, '-').toLowerCase()}-${new Date(session.startedAt).toISOString().split('T')[0]}.txt`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export session as text:', error);
      throw new Error('Failed to export session');
    }
  }

  /**
   * Generate a summary report for multiple sessions
   */
  static exportSummaryReport(sessions: InterviewSession[]): void {
    try {
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const averageScore = completedSessions.length > 0 
        ? Math.round(completedSessions.reduce((sum, s) => sum + (s.analysis?.overallScore || 0), 0) / completedSessions.length)
        : 0;
      
      const totalTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const totalQuestions = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);

      let content = `INTERVIEW SESSIONS SUMMARY REPORT\n`;
      content += `==================================\n\n`;
      content += `Report Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n\n`;
      
      content += `OVERVIEW\n`;
      content += `--------\n`;
      content += `Total Sessions: ${sessions.length}\n`;
      content += `Completed Sessions: ${completedSessions.length}\n`;
      content += `In Progress: ${sessions.filter(s => s.status === 'in_progress').length}\n`;
      content += `Abandoned: ${sessions.filter(s => s.status === 'abandoned').length}\n`;
      content += `Average Score: ${averageScore}%\n`;
      content += `Total Questions Answered: ${totalQuestions}\n`;
      content += `Total Interview Time: ${Math.round(totalTime / 60)} minutes\n\n`;

      content += `SESSION DETAILS\n`;
      content += `---------------\n\n`;

      sessions.forEach((session, index) => {
        content += `${index + 1}. ${session.position} (${session.interviewType})\n`;
        content += `   Status: ${session.status}\n`;
        content += `   Date: ${new Date(session.startedAt).toLocaleDateString()}\n`;
        content += `   Questions: ${session.questionsAnswered}/${session.totalQuestions}\n`;
        if (session.analysis?.overallScore) {
          content += `   Score: ${session.analysis.overallScore}%\n`;
        }
        content += `\n`;
      });

      const dataBlob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-sessions-summary-${new Date().toISOString().split('T')[0]}.txt`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export summary report:', error);
      throw new Error('Failed to export summary report');
    }
  }
}