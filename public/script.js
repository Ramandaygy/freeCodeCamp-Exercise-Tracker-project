// Load users for dropdowns
async function loadUsers() {
  try {
    const response = await fetch('/api/users');
    const users = await response.json();
    
    const userIdSelect = document.getElementById('user-id');
    const logUserIdSelect = document.getElementById('log-user-id');
    
    // Clear existing options except first
    userIdSelect.innerHTML = '<option value="">Select a user</option>';
    logUserIdSelect.innerHTML = '<option value="">Select a user</option>';
    
    users.forEach(user => {
      const option1 = document.createElement('option');
      option1.value = user._id;
      option1.textContent = `${user.username} (${user._id})`;
      userIdSelect.appendChild(option1);
      
      const option2 = document.createElement('option');
      option2.value = user._id;
      option2.textContent = `${user.username} (${user._id})`;
      logUserIdSelect.appendChild(option2);
    });
  } catch (err) {
    console.error('Failed to load users:', err);
  }
}

// Create User
document.getElementById('create-user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const responseDiv = document.getElementById('create-user-response');
  
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${encodeURIComponent(username)}`
    });
    const data = await res.json();
    if (res.ok) {
      responseDiv.innerHTML = `<div class="response success">User created: ${JSON.stringify(data, null, 2)}</div>`;
      document.getElementById('create-user-form').reset();
      loadUsers(); // Refresh user lists
    } else {
      responseDiv.innerHTML = `<div class="response error">Error: ${data.error}</div>`;
    }
  } catch (err) {
    responseDiv.innerHTML = `<div class="response error">Error: ${err.message}</div>`;
  }
});

// Add Exercise
document.getElementById('add-exercise-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const userId = document.getElementById('user-id').value;
  const description = document.getElementById('description').value;
  const duration = document.getElementById('duration').value;
  const date = document.getElementById('date').value;
  const responseDiv = document.getElementById('add-exercise-response');
  
  if (!userId) {
    responseDiv.innerHTML = '<div class="response error">Please select a user</div>';
    return;
  }
  
  let body = `description=${encodeURIComponent(description)}&duration=${encodeURIComponent(duration)}`;
  if (date) body += `&date=${encodeURIComponent(date)}`;
  
  try {
    const res = await fetch(`/api/users/${userId}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const data = await res.json();
    if (res.ok) {
      responseDiv.innerHTML = `<div class="response success">Exercise added: ${JSON.stringify(data, null, 2)}</div>`;
      document.getElementById('add-exercise-form').reset();
      document.getElementById('user-id').value = '';
    } else {
      responseDiv.innerHTML = `<div class="response error">Error: ${data.error}</div>`;
    }
  } catch (err) {
    responseDiv.innerHTML = `<div class="response error">Error: ${err.message}</div>`;
  }
});

// Get Logs
document.getElementById('get-logs-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const userId = document.getElementById('log-user-id').value;
  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;
  const limit = document.getElementById('limit').value;
  const responseDiv = document.getElementById('logs-response');
  
  if (!userId) {
    responseDiv.innerHTML = '<div class="response error">Please select a user</div>';
    return;
  }
  
  let url = `/api/users/${userId}/logs`;
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  if (limit) params.append('limit', limit);
  if (params.toString()) url += '?' + params.toString();
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok) {
      responseDiv.innerHTML = `<div class="response success"><pre>${JSON.stringify(data, null, 2)}</pre></div>`;
    } else {
      responseDiv.innerHTML = `<div class="response error">Error: ${data.error}</div>`;
    }
  } catch (err) {
    responseDiv.innerHTML = `<div class="response error">Error: ${err.message}</div>`;
  }
});

// Load users on page load
loadUsers();