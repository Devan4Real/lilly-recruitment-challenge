const elements = {
    searchInput: document.getElementById('searchInput'),
    addMedicineBtn: document.getElementById('addMedicineBtn'),
    medicineModal: document.getElementById('medicineModal'),
    closeModal: document.getElementById('closeModal'),
    medicineForm: document.getElementById('medicineForm'),
    modalTitle: document.getElementById('modalTitle'),
    medicineNameInput: document.getElementById('medicineName'),
    medicinePriceInput: document.getElementById('medicinePrice'),
    errorMessage: document.getElementById('errorMessage'),
    medicinesTableBody: document.getElementById('medicinesTableBody'),
    showReportBtn: document.getElementById('showReportBtn'),
    reportContainer: document.getElementById('reportContainer')
};

let medicines = [];
let currentEditId = null;


async function fetchMedicines() {
    showLoading();
    
    try {
        const response = await fetch('http://localhost:8000/medicines');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data?.medicines) {
            throw new Error('Invalid data format received from server');
        }
        medicines = data.medicines.filter(med => med?.name?.trim() && med.price != null);
        renderMedicines();
    } catch (error) {
        showError(error.message);
        console.error('Error fetching medicines:', error);
    }
}

async function createMedicine(name, price) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);

    try {
        const response = await fetch('http://localhost:8000/create', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Failed to create medicine');
        await fetchMedicines();
        closeModal();
        showNotification('Medicine created successfully');
    } catch (error) {
        elements.errorMessage.textContent = error.message;
    }
}

async function updateMedicine(name, price) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);

    try {
        const response = await fetch('http://localhost:8000/update', {
            method: 'PUT',
            body: formData
        });
        if (!response.ok) throw new Error('Failed to update medicine');
        await fetchMedicines();
        closeModal();
        showNotification('Medicine updated successfully');
    } catch (error) {
        elements.errorMessage.textContent = error.message;
    }
}

async function deleteMedicine(name) {
    if (!confirm(`Delete ${name}?`)) return;

    try {
        const formData = new FormData();
        formData.append('name', name);
        const response = await fetch('http://localhost:8000/delete', {
            method: 'DELETE',
            body: formData
        });
        if (!response.ok) throw new Error('Failed to delete medicine');
        await fetchMedicines();
        showNotification('Medicine deleted successfully');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function renderMedicines() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const filteredMedicines = medicines.filter(med => med.name.toLowerCase().includes(searchTerm));
    
    if (filteredMedicines.length === 0) {
        elements.medicinesTableBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center;">
                    No medicines found${searchTerm ? ' matching your search' : ''}.
                </td>
            </tr>
        `;
        return;
    }
    
    elements.medicinesTableBody.innerHTML = filteredMedicines.map(medicine => `
        <tr>
            <td>${medicine.name}</td>
            <td>$${Number(medicine.price).toFixed(2)}</td>
            <td>
                <button class="action-btn edit-btn" onclick="openEditModal('${medicine.name}', ${medicine.price})">
                    Edit
                </button>
                <button class="action-btn delete-btn" onclick="deleteMedicine('${medicine.name}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function showLoading() {
  elements.medicinesTableBody.innerHTML = `
    <tr>
      <td colspan="3">
        <div class="loading-container">
          <div class="loading-spinner"></div>
        </div>
      </td>
    </tr>
  `;
}

function showError(message) {
  elements.medicinesTableBody.innerHTML = `
    <tr>
      <td colspan="3">
        <div class="table-error">
          <p class="error-title">Unable to load medicines</p>
          <p class="error-message">${message}</p>
          <button onclick="fetchMedicines()" class="action-btn retry-btn">Try Again</button>
        </div>
      </td>
    </tr>
  `;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}



function openModal(isEdit = false, medicine = null) {
    elements.modalTitle.textContent = isEdit ? 'Edit Medicine' : 'Add Medicine';
    elements.medicineNameInput.value = medicine?.name || '';
    elements.medicinePriceInput.value = medicine?.price || '';
    currentEditId = medicine?.name || null;
    elements.errorMessage.textContent = '';
    elements.medicineModal.style.display = 'block';
}

function closeModal() {
    elements.medicineModal.style.display = 'none';
    elements.medicineForm.reset();
    elements.errorMessage.textContent = '';
    currentEditId = null;
}

function openEditModal(name, price) {
  openModal(true, { name, price });
}



elements.addMedicineBtn.addEventListener('click', () => openModal());
elements.closeModal.addEventListener('click', closeModal);
elements.searchInput.addEventListener('input', renderMedicines);

elements.medicineForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = elements.medicineNameInput.value.trim();
  const price = parseFloat(elements.medicinePriceInput.value);

  // If currentEditId is set, the user is editing; otherwise creating.
  if (currentEditId) {
    await updateMedicine(name, price); 
  } else {
    await createMedicine(name, price);
  }
});


fetchMedicines();



const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollPosition = window.pageYOffset;
    const distanceFromBottom = totalHeight - (scrollPosition + viewportHeight);

    if (window.innerWidth <= 768) {
        if (distanceFromBottom < 100) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    } else {
        if (window.pageYOffset > 100) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }
});

backToTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

async function fetchQuarterlyReport() {
  const reportContainer = document.getElementById('reportContainer');
  const showReportBtn = document.getElementById('showReportBtn');

  // active state
  showReportBtn.classList.toggle('active');

  if (reportContainer.innerHTML !== '') {
    reportContainer.innerHTML = '';
    showReportBtn.textContent = 'Show Quarterly Report';
    return;
  }

  showReportBtn.textContent = 'Hide Report';
  reportContainer.innerHTML = `
    <div class="loading-report">
      <div class="loading-spinner"></div>
      <p>Loading report...</p>
    </div>
  `;

  try {
    const response = await fetch('http://localhost:8000/quarterly-report');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    if (!data?.report) {
      reportContainer.innerHTML = `
        <div class="report-section error-report" style="text-align: center;">
          <p>No report data available.</p>
        </div>
      `;
      return;
    }

    const { average_price, total_medicines, median_price, min_price, max_price, analysis } = data.report;

 
    const total = analysis.price_distribution.low + 
                  analysis.price_distribution.medium + 
                  analysis.price_distribution.high;

    const lowPercent = (analysis.price_distribution.low / total * 100).toFixed(1);
    const mediumPercent = (analysis.price_distribution.medium / total * 100).toFixed(1);
    const highPercent = (analysis.price_distribution.high / total * 100).toFixed(1);

    reportContainer.innerHTML = `
      <div class="report-section">
        <div class="report-grid">
          <div class="stat-card">
            <div class="label">Average Price</div>
            <div class="value">$${average_price}</div>
          </div>
          <div class="stat-card">
            <div class="label">Total Medicines</div>
            <div class="value">${total_medicines}</div>
          </div>
          <div class="stat-card">
            <div class="label">Median Price</div>
            <div class="value">$${median_price}</div>
          </div>
          <div class="stat-card">
            <div class="label">Minimum Price</div>
            <div class="value">$${min_price}</div>
          </div>
          <div class="stat-card">
            <div class="label">Maximum Price</div>
            <div class="value">$${max_price}</div>
          </div>
          <div class="stat-card">
            <div class="label">Price Variance</div>
            <div class="value">$${analysis.price_variance}</div>
          </div>
        </div>

        <div class="distribution-section">
          <h3 class="distribution-title">Price Distribution</h3>
          <div class="price-distribution">
            <div class="price-category">
              <h4>Low Price Range</h4>
              <p class="count">${analysis.price_distribution.low} items</p>
              <div class="chart-container">
                <div class="chart-bar">
                  <div class="chart-bar-fill" style="width: ${lowPercent}%"></div>
                </div>
              </div>
              <small>${lowPercent}%</small>
            </div>
            <div class="price-category">
              <h4>Medium Price Range</h4>
              <p class="count">${analysis.price_distribution.medium} items</p>
              <div class="chart-container">
                <div class="chart-bar">
                  <div class="chart-bar-fill" style="width: ${mediumPercent}%"></div>
                </div>
              </div>
              <small>${mediumPercent}%</small>
            </div>
            <div class="price-category">
              <h4>High Price Range</h4>
              <p class="count">${analysis.price_distribution.high} items</p>
              <div class="chart-container">
                <div class="chart-bar">
                  <div class="chart-bar-fill" style="width: ${highPercent}%"></div>
                </div>
              </div>
              <small>${highPercent}%</small>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    reportContainer.innerHTML = `
      <div class="report-section error-report" style="text-align: center;">
        <p style="color: var(--secondary-color);">
          Error loading quarterly report: ${error.message}
        </p>
      </div>
    `;
    showReportBtn.textContent = 'Show Quarterly Report';
  }
}

const showReportBtn = document.getElementById('showReportBtn');
showReportBtn.addEventListener('click', fetchQuarterlyReport);