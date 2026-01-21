// Hole alle Daten
const sentimentNode = $('Sentiment verarbeiten').item.json;
const recommendationsRaw = $json.choices?.[0]?.message?.content || '{}';

const originalData = sentimentNode.originalData || {};
let sentimentAnalysis = sentimentNode.sentimentAnalysis || {};
let contentRecommendations = {};

// Falls sentimentAnalysis ein String ist, parsen
if (typeof sentimentAnalysis === 'string') {
  try { sentimentAnalysis = JSON.parse(sentimentAnalysis); } catch(e) { sentimentAnalysis = {}; }
}

try {
  contentRecommendations = JSON.parse(recommendationsRaw);
} catch(e) {
  contentRecommendations = { error: 'Parsing fehlgeschlagen' };
}

const { originalPrompt, recipientEmail, markeThema, timestamp, platforms } = originalData;

// Hilfsfunktionen
function mdToHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

function getSentimentColor(sentiment) {
  const s = String(sentiment || '').toLowerCase();
  if (s.includes('positiv') || s === 'positive') return '#28a745';
  if (s.includes('negativ') || s === 'negative') return '#dc3545';
  return '#6c757d';
}

function getSentimentEmoji(sentiment) {
  const s = String(sentiment || '').toLowerCase();
  if (s.includes('positiv') || s === 'positive') return '😊';
  if (s.includes('negativ') || s === 'negative') return '😟';
  return '😐';
}

function generateSentimentBar(score) {
  const percentage = Number(score) || 50;
  let color = '#6c757d';
  if (percentage >= 70) color = '#28a745';
  else if (percentage <= 30) color = '#dc3545';
  else if (percentage > 50) color = '#9acd32';
  else if (percentage < 50) color = '#ffa500';

  return `<div style="background: #e9ecef; border-radius: 10px; height: 20px; width: 100%; margin: 10px 0;"><div style="background: ${color}; width: ${percentage}%; height: 100%; border-radius: 10px; text-align: center; color: white; font-size: 12px; line-height: 20px;">${percentage}/100</div></div>`;
}

function generateCitationsHtml(citations) {
  if (!citations || citations.length === 0) return '';
  return `
    <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #17a2b8;">
      <strong style="color: #0c5460;">🔗 Quellen-Links:</strong>
      <ol style="margin: 10px 0 0 0; padding-left: 25px;">
        ${citations.map(url => `<li style="margin-bottom: 8px;"><a href="${url}" target="_blank" style="color: #007bff; word-break: break-all;">${url}</a></li>`).join('')}
      </ol>
    </div>`;
}

function generatePlatformSection(name, platformData, sentiment, color) {
  if (!platformData || !platformData.success) {
    return `
      <div style="margin-bottom: 30px; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
        <div style="background-color: ${color}; color: white; padding: 15px;">
          <h2 style="margin: 0;">❌ ${name}</h2>
        </div>
        <div style="padding: 20px;"><p>Keine Daten verfügbar</p></div>
      </div>`;
  }

  const sentimentValue = sentiment?.sentiment || sentiment?.overall || 'Nicht analysiert';
  const sentimentEmoji = getSentimentEmoji(sentimentValue);
  const sentimentColor = getSentimentColor(sentimentValue);
  const score = sentiment?.score;

  let html = `
    <div style="margin-bottom: 30px; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
      <div style="background-color: ${color}; color: white; padding: 15px;">
        <h2 style="margin: 0;">✅ ${name}</h2>
      </div>
      <div style="padding: 20px;">`;

  // Sentiment Bewertung
  html += `
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #495057;">📊 Sentiment-Bewertung</h3>
          <p style="margin: 5px 0;"><strong>Bewertung:</strong> <span style="color: ${sentimentColor}; font-weight: bold;">${sentimentEmoji} ${sentimentValue}</span></p>`;

  if (score !== undefined && score !== null) {
    html += generateSentimentBar(score);
  }
  if (sentiment?.summary) {
    html += `<p style="margin: 10px 0 0 0; font-style: italic; color: #6c757d;">${sentiment.summary}</p>`;
  }
  html += '</div>';

  // Positive Passagen
  if (sentiment?.positive_passages?.length > 0) {
    html += `
        <div style="background: #d4edda; padding: 10px 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #28a745;">
          <strong style="color: #155724;">😊 Positive Passagen:</strong>
          <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            ${sentiment.positive_passages.map(p => `<li style="color: #155724;">${p}</li>`).join('')}
          </ul>
        </div>`;
  }

  // Neutrale Passagen
  if (sentiment?.neutral_passages?.length > 0) {
    html += `
        <div style="background: #e9ecef; padding: 10px 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #6c757d;">
          <strong style="color: #495057;">😐 Neutrale Passagen:</strong>
          <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            ${sentiment.neutral_passages.map(p => `<li style="color: #495057;">${p}</li>`).join('')}
          </ul>
        </div>`;
  }

  // Negative Passagen
  if (sentiment?.negative_passages?.length > 0) {
    html += `
        <div style="background: #f8d7da; padding: 10px 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #dc3545;">
          <strong style="color: #721c24;">😟 Negative Passagen:</strong>
          <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            ${sentiment.negative_passages.map(p => `<li style="color: #721c24;">${p}</li>`).join('')}
          </ul>
        </div>`;
  }

  // Erwähnte Quellen aus Sentiment
  if (sentiment?.mentioned_sources?.length > 0) {
    html += `
        <div style="background: #cce5ff; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #004085;">
          <strong style="color: #004085;">📚 Erwähnte Quellen:</strong>
          <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            ${sentiment.mentioned_sources.map(s => `<li style="color: #004085;">${s}</li>`).join('')}
          </ul>
        </div>`;
  }

  // Perplexity Citations (echte URLs als klickbare Links)
  if (platformData.citations?.length > 0) {
    html += generateCitationsHtml(platformData.citations);
  }

  // Original-Antwort
  html += `
        <details style="margin-top: 15px;">
          <summary style="cursor: pointer; color: #007bff; font-weight: bold;">📝 Vollständige Antwort anzeigen</summary>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 10px; max-height: 300px; overflow-y: auto;">
            ${mdToHtml(platformData.content)}
          </div>
        </details>
      </div>
    </div>`;

  return html;
}

function generateRecommendationsSection(recs) {
  if (!recs || recs.error) {
    return '<p style="color: #6c757d;">Keine Empfehlungen verfügbar.</p>';
  }

  let html = '';

  // Content Empfehlungen
  if (recs.content_recommendations?.length > 0) {
    html += '<div style="margin-bottom: 30px;">';
    html += '<h3 style="color: #495057;">📝 Content-Empfehlungen</h3>';

    recs.content_recommendations.forEach((rec, idx) => {
      const priorityColor = rec.priority === 'hoch' ? '#dc3545' : (rec.priority === 'mittel' ? '#ffc107' : '#28a745');
      const priorityEmoji = rec.priority === 'hoch' ? '🔴' : (rec.priority === 'mittel' ? '🟡' : '🟢');

      html += `
        <div style="border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 15px; border-left: 4px solid ${priorityColor};">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
            <h4 style="margin: 0; color: #333;">${idx + 1}. ${rec.title || 'Content-Idee'}</h4>
            <span style="background: ${priorityColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${priorityEmoji} ${rec.priority || 'mittel'}</span>
          </div>
          <p style="margin: 10px 0;"><strong>Typ:</strong> ${rec.type || 'Nicht spezifiziert'}</p>
          <p style="margin: 10px 0;">${rec.description || ''}</p>
          ${rec.keywords?.length > 0 ? `<p style="margin: 10px 0;"><strong>Keywords:</strong> ${rec.keywords.join(', ')}</p>` : ''}
          ${rec.target_sources?.length > 0 ? `<p style="margin: 10px 0;"><strong>Ziel-Quellen:</strong> ${rec.target_sources.join(', ')}</p>` : ''}
          ${rec.reasoning ? `<p style="margin: 10px 0; font-style: italic; color: #6c757d;"><strong>Begründung:</strong> ${rec.reasoning}</p>` : ''}
        </div>
      `;
    });
    html += '</div>';
  }

  // Quick Wins
  if (recs.quick_wins?.length > 0) {
    html += `
      <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #155724;">⚡ Quick Wins</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${recs.quick_wins.map(qw => `<li style="margin-bottom: 8px;">${qw}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Langfristige Strategie
  if (recs.long_term_strategy) {
    html += `
      <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0066cc;">
        <h3 style="margin: 0 0 10px 0; color: #004085;">🎯 Langfristige Strategie</h3>
        <p style="margin: 0; color: #004085;">${recs.long_term_strategy}</p>
      </div>
    `;
  }

  // Ziel-Quellen
  if (recs.sources_to_target?.length > 0) {
    html += `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #495057;">🎯 Ziel-Quellen für Sichtbarkeit</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">Quelle</th>
              <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">Empfohlene Aktion</th>
            </tr>
          </thead>
          <tbody>
            ${recs.sources_to_target.map(s => `
              <tr>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${s.source || '-'}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${s.action || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  return html;
}

// HTML Report zusammenbauen
const htmlReport = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Visibility Report mit Sentiment-Analyse</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; background: #ffffff;">

  <!-- Header -->
  <div style="text-align: center; margin-bottom: 30px; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
    <h1 style="margin: 0 0 10px 0;">🔍 AI Visibility Report</h1>
    <p style="margin: 0; opacity: 0.9;">Multi-Plattform Analyse mit Sentiment-Bewertung</p>
  </div>

  <!-- Analyse-Details -->
  <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #0066cc;">
    <h3 style="margin: 0 0 10px 0; color: #0066cc;">📋 Analyse-Details</h3>
    <p><strong>Zeitpunkt:</strong> ${timestamp}</p>
    <p><strong>Thema/Marke:</strong> ${markeThema}</p>
    <p><strong>Prompt:</strong> <em>${originalPrompt}</em></p>
  </div>

  <!-- Gesamtübersicht -->
  ${sentimentAnalysis.overall_summary ? `
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 12px; margin-bottom: 30px; color: white;">
      <h3 style="margin: 0 0 10px 0;">📊 Gesamt-Zusammenfassung</h3>
      <p style="margin: 0; font-size: 16px;">${sentimentAnalysis.overall_summary}</p>
    </div>
  ` : ''}

  <!-- Ergebnisse nach Plattform -->
  <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Ergebnisse nach Plattform</h2>

  ${generatePlatformSection('ChatGPT (GPT-4o)', platforms?.chatgpt, sentimentAnalysis?.chatgpt, '#10a37f')}
  ${generatePlatformSection('Google Gemini 1.5 Pro', platforms?.gemini, sentimentAnalysis?.gemini, '#4285f4')}
  ${generatePlatformSection('Perplexity', platforms?.perplexity, sentimentAnalysis?.perplexity, '#20b2aa')}

  <!-- Content-Empfehlungen -->
  <h2 style="color: #333; border-bottom: 2px solid #f5576c; padding-bottom: 10px; margin-top: 40px;">🚀 Content-Empfehlungen für KI-Sichtbarkeit</h2>

  ${generateRecommendationsSection(contentRecommendations)}

  <!-- Footer -->
  <div style="margin-top: 40px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
    <h3 style="color: #495057;">📈 Nächste Schritte</h3>
    <p>Setzen Sie die Content-Empfehlungen um, um Ihre Sichtbarkeit in KI-Systemen zu verbessern.</p>
    <p style="color: #6c757d; font-size: 12px;">Generiert mit n8n AI Visibility Checker v3.0</p>
  </div>

</body>
</html>
`;

return {
  json: {
    htmlReport,
    recipientEmail: recipientEmail || '',
    subject: `AI Visibility Report: ${markeThema} - ${timestamp}`,
    originalPrompt
  }
};
