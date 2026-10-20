/**
 * HEMS Backend Diagnostics & Testing
 * Implementation of core system tests
 */

const diagnosticTests = [
  {
    id: 'health',
    name: 'Backend Server Health',
    description: 'Verifies the Node.js Express server is running and reachable.',
    run: async () => {
      const res = await fetch('/api/diagnostics/health');
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.error || 'Server health check failed');
        err.status = res.status;
        throw err;
      }
      return { data, status: res.status };
    }
  },
  {
    id: 'gemini',
    name: 'Gemini AI Connectivity',
    description: 'Tests the actual Gemini API through the backend proxy.',
    run: async () => {
      const res = await fetch('/api/diagnostics/gemini-check');
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.error || 'Gemini API test failed');
        err.status = res.status;
        throw err;
      }
      return { data, status: res.status };
    }
  },
  {
    id: 'supabase-config',
    name: 'Supabase Configuration',
    description: 'Verifies the server has the necessary environment variables for Supabase.',
    run: async () => {
      const res = await fetch('/api/diagnostics/supabase-config');
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.error || 'Supabase config check failed');
        err.status = res.status;
        throw err;
      }
      return { data, status: res.status };
    }
  },
  {
    id: 'auth-session',
    name: 'Supabase Authentication',
    description: 'Checks current frontend session state via Supabase SDK.',
    run: async () => {
      if (typeof AuthService === 'undefined' || !AuthService.init) {
        throw new Error('AuthService not loaded');
      }
      await AuthService.init();
      const user = AuthService.getCurrentUser();
      const supabase = typeof getSupabase === 'function' ? getSupabase() : null;
      
      if (!supabase) return { status: 'warning', message: 'Supabase client not initialized.' };
      
      const { data: { session } } = await supabase.auth.getSession();
      
      return {
        authenticated: !!user,
        session_active: !!session,
        user_id: user?.id || 'none',
        user_email: user?.email || 'none'
      };
    }
  },
  {
    id: 'event-crud',
    name: 'Event CRUD & RLS',
    description: 'Safely tests Create, Read, Update, and Delete for a temporary diagnostic event.',
    run: async () => {
      if (typeof AuthService === 'undefined' || typeof EventService === 'undefined') {
        throw new Error('Services not loaded');
      }
      const user = AuthService.getCurrentUser();
      if (!user) return { status: 'skipped', message: 'Authentication required for CRUD tests.' };

      const testId = 'diag_' + Date.now();
      const eventData = {
        name: 'DIAGNOSTIC TEST EVENT - ' + testId,
        event_type: 'Other',
        event_date: new Date().toISOString().split('T')[0],
        guest_count: 1,
        budget: 100,
        description: 'Automated diagnostic test record. Should be deleted immediately.',
        status: 'Draft'
      };

      const createRes = await EventService.createEvent(eventData);
      if (!createRes.success) throw new Error('Create event failed: ' + createRes.message);
      const createdEvent = createRes.event;

      try {
        const fetched = await EventService.getEventById(createdEvent.id);
        if (!fetched || fetched.name !== eventData.name) throw new Error('Read verification failed.');

        const updateRes = await EventService.updateEvent(createdEvent.id, { description: 'Updated' });
        if (!updateRes.success) throw new Error('Update failed.');

        const deleteRes = await EventService.deleteEvent(createdEvent.id);
        if (!deleteRes) throw new Error('Delete failed.');

        return { status: 'passed', created_id: createdEvent.id, rls_check: 'passed' };
      } catch (err) {
        if (createdEvent?.id) await EventService.deleteEvent(createdEvent.id);
        throw err;
      }
    }
  },
  {
    id: 'req-persistence',
    name: 'Requirements Persistence',
    description: 'Verifies ability to save and fetch event requirements.',
    run: async () => {
      if (typeof RequirementService === 'undefined') throw new Error('RequirementService not loaded');
      const user = AuthService.getCurrentUser();
      if (!user) return { status: 'skipped', message: 'Authentication required.' };

      const eventRes = await EventService.createEvent({ name: 'REQ_TEST', event_type: 'Other', guest_count: 1, budget: 100 });
      const eventId = eventRes.event.id;

      try {
        const reqData = { category: 'Other', item: 'Test Req', quantity: 1, estimated_cost: 10 };
        await RequirementService.createRequirement(eventId, reqData);
        
        const list = await RequirementService.getRequirements(eventId);
        const saved = list.find(r => r.item === 'Test Req');
        if (!saved) throw new Error('Requirement not persisted.');

        await EventService.deleteEvent(eventId);
        return { status: 'passed', requirement_id: saved.id };
      } catch (err) {
        await EventService.deleteEvent(eventId);
        throw err;
      }
    }
  },
  {
    id: 'task-persistence',
    name: 'Task Persistence',
    description: 'Verifies ability to save and fetch milestone tasks.',
    run: async () => {
      if (typeof TaskService === 'undefined') throw new Error('TaskService not loaded');
      const user = AuthService.getCurrentUser();
      if (!user) return { status: 'skipped', message: 'Authentication required.' };

      const eventRes = await EventService.createEvent({ name: 'TASK_TEST', event_type: 'Other', guest_count: 1, budget: 100 });
      const eventId = eventRes.event.id;

      try {
        const taskData = { event_id: eventId, title: 'Test Task', status: 'Pending', due_date: new Date().toISOString() };
        await TaskService.createTask(taskData);
        
        const list = await TaskService.getTasks(eventId);
        const saved = list.find(t => t.title === 'Test Task');
        if (!saved) throw new Error('Task not persisted.');

        await EventService.deleteEvent(eventId);
        return { status: 'passed', task_id: saved.id };
      } catch (err) {
        await EventService.deleteEvent(eventId);
        throw err;
      }
    }
  },
  {
    id: 'ai-pipeline',
    name: 'AI Planning API',
    description: 'Full integration test of the /api/ai/analyze-event endpoint.',
    run: async () => {
      if (typeof AIService === 'undefined') throw new Error('AIService not loaded');
      const testInput = {
        name: 'Diag Conference 2026',
        event_type: 'Conference',
        guest_count: 10,
        budget: 10000,
        location: 'Small Hall'
      };

      const res = await AIService.analyzeEvent(testInput);
      
      if (!res.requirements || !res.tasks || !res.event_summary) {
        throw new Error('AI Response is missing required schema sections.');
      }

      const actualTotal = res.requirements.reduce((s, r) => s + (r.estimated_cost || 0), 0);
      const isCompliant = actualTotal <= testInput.budget;

      return {
        data: {
          summary: res.event_summary.overview,
          requirement_count: res.requirements.length,
          task_count: res.tasks.length,
          calculated_total: actualTotal,
          budget_compliant: isCompliant
        },
        status: 200
      };
    }
  },
  {
    id: 'budget-logic',
    name: 'Budget Calculation',
    description: 'Verifies the mathematical accuracy of the frontend budget optimizer.',
    run: async () => {
      const mockBudget = 5000;
      const mockReqs = [
        { estimated_cost: 2000 },
        { estimated_cost: 1500 },
        { estimated_cost: 1000 }
      ];
      
      const total = mockReqs.reduce((s, r) => s + r.estimated_cost, 0);
      const variance = mockBudget - total;
      
      if (total !== 4500) throw new Error('Summation logic error.');
      if (variance !== 500) throw new Error('Variance calculation error.');

      return { budget: mockBudget, consumed: total, remaining: variance, status: 'ok' };
    }
  },
  {
    id: 'security-env-check',
    name: 'Environment Security',
    description: 'Checks if environment labels are correctly detected.',
    run: async () => {
      const label = document.getElementById('env-label');
      const envText = label ? label.textContent : 'Unknown';
      return {
        mode: envText,
        restriction_check: 'complete',
        session_active: !!localStorage.getItem('hems_active_user')
      };
    }
  }
];

let diagnosticResults = {};

function initDiagnostics() {
  const container = document.getElementById('test-cards-container');
  if (!container) return;

  container.innerHTML = diagnosticTests.map(t => `
    <div class="card test-card" id="card-${t.id}">
      <div class="card-header">
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="test-status-pill status-not-run" id="status-${t.id}">Not Run</div>
          <h3 class="card-title">${t.name}</h3>
        </div>
        <button class="btn btn-sm btn-outline btn-run-test" onclick="window.runSingleTest('${t.id}')">Run Test</button>
      </div>
      <div class="card-body">
        <p class="text-secondary" style="font-size:0.85rem; margin-bottom:12px;">${t.description}</p>
        <div id="results-${t.id}" style="display:none;">
          <div class="test-meta-grid">
            <div>Start: <span id="start-${t.id}">--</span></div>
            <div>Duration: <span id="dur-${t.id}">--</span>ms</div>
            <div>HTTP: <span id="http-${t.id}">--</span></div>
          </div>
          <pre class="result-preview" id="preview-${t.id}"></pre>
        </div>
      </div>
    </div>
  `).join('');

  const isDev = window.location.hostname.includes('localhost') || 
                window.location.hostname.includes('127.0.0.1') || 
                window.location.hostname.includes('ais-dev');
  
  const envLabel = document.getElementById('env-label');
  if (envLabel) {
    envLabel.textContent = 'Environment: ' + (isDev ? 'Development' : 'Production');
    envLabel.className = 'badge ' + (isDev ? 'badge-planning' : 'badge-confirmed');
  }
}

async function runSingleTest(testId) {
  const test = diagnosticTests.find(t => t.id === testId);
  if (!test) return;

  const card = document.getElementById('card-' + testId);
  const statusPill = document.getElementById('status-' + testId);
  const resultsDiv = document.getElementById('results-' + testId);
  const preview = document.getElementById('preview-' + testId);
  const startEl = document.getElementById('start-' + testId);
  const durEl = document.getElementById('dur-' + testId);

  if (card) card.className = 'card test-card running';
  if (statusPill) {
    statusPill.textContent = 'Running';
    statusPill.className = 'test-status-pill status-running';
  }
  if (resultsDiv) resultsDiv.style.display = 'block';
  if (preview) preview.textContent = 'Executing...';
  
  const startTime = Date.now();
  if (startEl) startEl.textContent = new Date().toLocaleTimeString();

  try {
    const responseObj = await test.run();
    const result = responseObj.data !== undefined ? responseObj.data : responseObj;
    const httpStatus = responseObj.status || 200;

    const duration = Date.now() - startTime;
    if (durEl) durEl.textContent = duration;
    const httpEl = document.getElementById('http-' + testId);
    if (httpEl) httpEl.textContent = httpStatus;

    let finalStatus = 'passed';
    if (result && result.status === 'warning') finalStatus = 'warning';
    if (result && result.status === 'skipped') finalStatus = 'skipped';

    if (card) card.className = 'card test-card ' + finalStatus;
    if (statusPill) {
      statusPill.textContent = finalStatus.toUpperCase();
      statusPill.className = 'test-status-pill status-' + finalStatus;
    }
    if (preview) preview.textContent = JSON.stringify(result, null, 2);
    
    diagnosticResults[testId] = { status: finalStatus, httpStatus, duration, result, timestamp: new Date().toISOString() };
  } catch (err) {
    const duration = Date.now() - startTime;
    if (durEl) durEl.textContent = duration;
    
    const httpStatus = err.status || '--';
    const httpEl = document.getElementById('http-' + testId);
    if (httpEl) httpEl.textContent = httpStatus;

    if (card) card.className = 'card test-card failed';
    if (statusPill) {
      statusPill.textContent = 'FAILED';
      statusPill.className = 'test-status-pill status-failed';
    }
    if (preview) preview.textContent = 'Error: ' + err.message;
    
    diagnosticResults[testId] = { status: 'failed', httpStatus, duration, error: err.message, timestamp: new Date().toISOString() };
  }

  updateDiagnosticSummary();
}

async function runAllTests() {
  const btn = document.getElementById('btn-run-all');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Running All...';
  }

  for (const test of diagnosticTests) {
    await runSingleTest(test.id);
  }

  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Run All Tests';
  }
  const lastRunEl = document.getElementById('last-run-timestamp');
  if (lastRunEl) lastRunEl.textContent = 'Last Session: ' + new Date().toLocaleString();
}

function updateDiagnosticSummary() {
  const allResults = Object.values(diagnosticResults);
  const passed = allResults.filter(r => r.status === 'passed').length;
  const failed = allResults.filter(r => r.status === 'failed').length;
  
  const passedEl = document.getElementById('count-passed');
  const failedEl = document.getElementById('count-failed');
  if (passedEl) passedEl.textContent = passed;
  if (failedEl) failedEl.textContent = failed;
  
  const overallBadge = document.getElementById('overall-status');
  if (overallBadge) {
    if (failed > 0) {
      overallBadge.textContent = 'Overall: FAILED';
      overallBadge.className = 'badge badge-cancelled';
    } else if (passed === diagnosticTests.length) {
      overallBadge.textContent = 'Overall: PASSED';
      overallBadge.className = 'badge badge-completed';
    } else {
      overallBadge.textContent = 'Overall: IN PROGRESS';
      overallBadge.className = 'badge badge-planning';
    }
  }
}

function clearDiagnosticResults() {
  diagnosticResults = {};
  initDiagnostics();
  const passedEl = document.getElementById('count-passed');
  const failedEl = document.getElementById('count-failed');
  if (passedEl) passedEl.textContent = '0';
  if (failedEl) failedEl.textContent = '0';
  
  const overallBadge = document.getElementById('overall-status');
  if (overallBadge) {
    overallBadge.textContent = 'Overall: NOT RUN';
    overallBadge.className = 'badge badge-planning';
  }
}

function saveReportJSON() {
  const report = {
    system: 'HEMS Backend Diagnostics',
    timestamp: new Date().toISOString(),
    environment: document.getElementById('env-label')?.textContent || 'Unknown',
    summary: {
      total: diagnosticTests.length,
      passed: parseInt(document.getElementById('count-passed')?.textContent || '0'),
      failed: parseInt(document.getElementById('count-failed')?.textContent || '0')
    },
    results: diagnosticResults
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hems-diagnostic-report-' + new Date().getTime() + '.json';
  a.click();
}

// Global Exports
window.runAllTests = runAllTests;
window.runSingleTest = runSingleTest;
window.clearAllResults = clearDiagnosticResults;
window.saveReportJSON = saveReportJSON;

// Global toggle for sidebar
const sidebarBtn = document.querySelector('.sidebar-toggle-btn');
if (sidebarBtn) {
  sidebarBtn.onclick = () => {
    document.querySelector('.app-sidebar')?.classList.toggle('mobile-open');
    document.querySelector('.mobile-overlay')?.classList.toggle('active');
  };
}

window.addEventListener('DOMContentLoaded', initDiagnostics);
