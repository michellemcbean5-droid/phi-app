/*
 * Prince Haul Intelligence — Free Google Delivery Bridge
 *
 * This script runs in the approved PHI Gmail account. It reads PHI's prepared
 * consented follow-up queue, sends only when PHI_DELIVERY_MODE is explicitly
 * set to SEND_CONSENTED, and writes a verified Gmail message ID back to PHI.
 *
 * Required Script Properties:
 *   PHI_SITE_URL              https://your-single-phi-domain.example
 *   PHI_AUTOMATION_ACCESS_KEY the limited key accepted only by /api/automation
 *   PHI_DELIVERY_MODE         DRAFT_ONLY (safe default) or SEND_CONSENTED
 *
 * Optional Script Properties:
 *   PHI_SENDER_NAME           Prince Haul Intelligence
 *   PHI_BATCH_LIMIT           10 (maximum 20)
 *
 * Do not put PHI_AUTOMATION_ACCESS_KEY in this source file. Set it in Apps
 * Script Project Settings > Script properties instead.
 */

const PHI_DEFAULT_SENDER = 'Prince Haul Intelligence';
const PHI_SAFE_MODE = 'DRAFT_ONLY';
const PHI_LIVE_MODE = 'SEND_CONSENTED';

function installPhiLeadEngine() {
  const properties = getPhiConfig();
  validatePhiConfig(properties);
  removePhiTriggers();
  ScriptApp.newTrigger('runPhiLeadEngine')
    .timeBased()
    .everyMinutes(5)
    .create();
  console.log('PHI lead engine installed in safe draft-only mode. Change PHI_DELIVERY_MODE to SEND_CONSENTED only when ready for real customer delivery.');
}

function removePhiTriggers() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === 'runPhiLeadEngine')
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
}

function runPhiLeadEngine() {
  const config = getPhiConfig();
  validatePhiConfig(config);
  const followups = phiRequest(config, '/followups?status=ready&limit=' + config.batchLimit, 'get');
  const availableRecipients = MailApp.getRemainingDailyQuota();
  const allowed = Math.min(followups.length, config.batchLimit, availableRecipients);

  for (let index = 0; index < allowed; index += 1) {
    const followup = followups[index];
    try {
      processFollowup(config, followup);
    } catch (error) {
      console.error('PHI follow-up ' + followup.id + ' failed: ' + error.message);
    }
  }

  console.log('PHI lead engine completed. Queue reviewed: ' + followups.length + '; attempted: ' + allowed + '; daily recipient quota remaining before this run: ' + availableRecipients + '.');
}

function processFollowup(config, followup) {
  const previousMessage = findPhiSentMessage(followup);
  if (previousMessage) {
    markFollowupSent(config, followup, previousMessage.getId(), 'Recovered an already-sent PHI message from Gmail before attempting delivery.');
    return;
  }

  const body = followup.body + '\n\nPHI reference: ' + followup.id;
  if (config.deliveryMode !== PHI_LIVE_MODE) {
    const draft = GmailApp.createDraft(followup.lead_email, followup.subject || 'Your PHI Assessment', body, {
      name: config.senderName,
    });
    markFollowupHeld(config, followup, 'Created Gmail draft ' + draft.getId() + ' for PHI review. No external message was sent because PHI_DELIVERY_MODE is not SEND_CONSENTED.');
    console.log('Created PHI draft ' + draft.getId() + ' for follow-up ' + followup.id + ' and held the queue record for review.');
    return;
  }

  GmailApp.sendEmail(followup.lead_email, followup.subject || 'Your PHI Assessment', body, {
    name: config.senderName,
  });

  // GmailApp.sendEmail does not return a message ID. The stable PHI reference is
  // included in the body so PHI can locate the actual sent message and keep a
  // truthful delivery receipt in the customer record.
  Utilities.sleep(1000);
  const sentMessage = findPhiSentMessage(followup);
  if (!sentMessage) {
    throw new Error('Gmail accepted the send but the PHI reference could not be found in Sent mail yet. The next run will retry receipt recovery before sending again.');
  }
  markFollowupSent(config, followup, sentMessage.getId(), 'Consent-based PHI assessment response sent through the approved Gmail account.');
}

function markFollowupSent(config, followup, gmailMessageId, reason) {
  phiRequest(config, '/followups/' + encodeURIComponent(followup.id), 'patch', {
    status: 'sent',
    reason: reason,
    external_message_id: 'gmail:' + gmailMessageId,
  });
}

function markFollowupHeld(config, followup, reason) {
  phiRequest(config, '/followups/' + encodeURIComponent(followup.id), 'patch', {
    status: 'held',
    reason: reason,
  });
}

function findPhiSentMessage(followup) {
  const reference = '"PHI reference: ' + followup.id + '"';
  const threads = GmailApp.search('in:sent ' + reference, 0, 10);
  if (!threads.length) return null;
  const messages = threads[0].getMessages();
  return messages[messages.length - 1] || null;
}

function getPhiConfig() {
  const properties = PropertiesService.getScriptProperties();
  const rawLimit = Number(properties.getProperty('PHI_BATCH_LIMIT') || '10');
  return {
    siteUrl: (properties.getProperty('PHI_SITE_URL') || '').replace(/\/$/, ''),
    automationAccessKey: properties.getProperty('PHI_AUTOMATION_ACCESS_KEY') || '',
    deliveryMode: properties.getProperty('PHI_DELIVERY_MODE') || PHI_SAFE_MODE,
    senderName: properties.getProperty('PHI_SENDER_NAME') || PHI_DEFAULT_SENDER,
    batchLimit: Math.max(1, Math.min(20, Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 10)),
  };
}

function validatePhiConfig(config) {
  if (!config.siteUrl || !config.automationAccessKey) {
    throw new Error('Set PHI_SITE_URL and PHI_AUTOMATION_ACCESS_KEY in Apps Script Project Settings > Script properties before installing the PHI lead engine.');
  }
  if ([PHI_SAFE_MODE, PHI_LIVE_MODE].indexOf(config.deliveryMode) === -1) {
    throw new Error('PHI_DELIVERY_MODE must be DRAFT_ONLY or SEND_CONSENTED.');
  }
}

function phiRequest(config, path, method, payload) {
  const options = {
    method: method || 'get',
    headers: { 'X-PHI-Automation-Key': config.automationAccessKey },
    muteHttpExceptions: true,
  };
  if (payload) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(payload);
  }
  const response = UrlFetchApp.fetch(config.siteUrl + '/api/automation' + path, options);
  const status = response.getResponseCode();
  const text = response.getContentText();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error('PHI API returned invalid JSON (HTTP ' + status + ').');
  }
  if (status < 200 || status >= 300) {
    throw new Error(data.detail || 'PHI API request failed with HTTP ' + status + '.');
  }
  return data;
}
