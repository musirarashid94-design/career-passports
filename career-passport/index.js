let isSignup = false; // false = login mode, true = signup mode

// ================= Login / signup =================
const toggleBtn = document.getElementById('toggleBtn');
const nameField = document.getElementById('nameField');
const authBtn = document.getElementById('authBtn');
const usernameInput = document.getElementById('username');
const userEmailInput = document.getElementById('userEmail');
const passwordInput = document.getElementById('password');
const userTypeSelect = document.getElementById('userType');
const rememberMeCheck = document.getElementById('rememberMe');
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', () => {
    
    state.userEmail = null;
    state.userType = null;

    localStorage.removeItem('rememberedUser');

    
    document.getElementById('homeSection').classList.add('d-none');
    document.getElementById('landingSection').classList.remove('d-none');
    document.getElementById('mainNavbar').classList.add('d-none');

    usernameInput.value = '';
    userEmailInput.value = '';
    passwordInput.value = '';
    userTypeSelect.value = '';
    rememberMeCheck.checked = false;

   
    if (isSignup) toggleBtn.click();
});


toggleBtn.addEventListener('click', () => {
    isSignup = !isSignup;
    nameField.style.display = isSignup ? 'block' : 'none';
    authBtn.textContent = isSignup ? 'Signup' : 'Login';
    toggleBtn.textContent = isSignup ? 'Switch to Login' : 'Switch to Signup';
});

authBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim();
    const email = userEmailInput.value.trim();
    const password = passwordInput.value;
    const userType = userTypeSelect.value;
    const remember = rememberMeCheck.checked;

   
 let users = JSON.parse(localStorage.getItem('nsn_users') || '[]');

  if (isSignup) {
        
    if (!name || !email || !password || !userType) return alert('Please fill all fields!');

    
    if (users.some(u => u.email === email)) return alert('Email already registered!');

   
    users.push({ name, email, password, userType });
    localStorage.setItem('nsn_users', JSON.stringify(users));

    alert('Signup successful! Now login.');
    toggleBtn.click(); 
    return;
    }

   
    const savedUser = users.find(u => u.email === email && u.password === password);
    if (!savedUser) return alert('Invalid email or password!');

    state.userEmail = savedUser.email;
    state.userType = savedUser.userType;

  
    if (remember) localStorage.setItem('rememberedUser', JSON.stringify(savedUser));
    else localStorage.removeItem('rememberedUser');

  
    loadHomepage(savedUser.name, savedUser.userType);
    loadResources(savedUser.userType);
    loadCareers(savedUser.userType);
    loadStories(savedUser.userType);
    loadMultimedia(savedUser.userType);
    loadQuizzes(savedUser.userType);
    bindMultimediaFilters();
    renderBookmarks();
});

window.addEventListener('load', () => {
    const rememberedUser = JSON.parse(localStorage.getItem('rememberedUser'));
    if (rememberedUser) {
        state.userEmail = rememberedUser.email;
        state.userType = rememberedUser.userType;

        loadHomepage(rememberedUser.name, rememberedUser.userType);
        loadCareers(rememberedUser.userType);
        loadMultimedia(rememberedUser.userType);
        loadStories(rememberedUser.userType);
        loadResources(rememberedUser.userType);
        loadQuizzes(rememberedUser.userType);
        bindMultimediaFilters();
        renderBookmarks();
    }
});
// ----------Data------------

let allCareers = [];       
let currentType = null;    

const DATA = { quizzes: [] };


const categoryConfig = {
    "undergraduate": "./career-bank/career-bank-undergrad.json",
    "graduate": "./career-bank/career-bank-graduate.json",
    "students": "./career-bank/career-bank-student.json",
    "professional": "./career-bank/career-bank-working-professional.json"
};

// --------navbar----------

function loadHomepage(name,userType) {
    document.getElementById('landingSection').classList.add('d-none');
    document.getElementById('homeSection').classList.remove('d-none');
    document.getElementById('mainNavbar').classList.remove('d-none'); 

    const greet = `Welcome, ${name}!`;
    const greetEl = document.getElementById('navGreeting');
    if (greetEl) greetEl.textContent = greet;

    showTab('career', userType); 
}

function setupNavbar() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const tab = link.dataset.tab;
            if (!tab) return;

            document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('d-none'));
            const pane = document.getElementById(tab);
            if (pane) pane.classList.remove('d-none');

            document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
        });
    });
}
function showTab(tabName, type) {
    

    if (tabName === 'career' && type !== state.userType) {
        return alert(`You didn’t sign up for this category (${type}).`);
    }
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('d-none'));

    const pane = document.getElementById(tabName);
    if (pane) pane.classList.remove('d-none');

    document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
    const link = document.querySelector(`.nav-link[data-tab="${tabName}"]`);
    if (link) link.classList.add('active');

    if (tabName === 'career') {
        const careerType = type ; 

        
        document.querySelectorAll('.industry-dropdown').forEach(d => d.classList.add('d-none'));

       
        const dropdown = document.getElementById(`filterIndustry${capitalize(careerType)}`);
        if (dropdown) dropdown.classList.remove('d-none');

        loadCareers(careerType);
   }
}

// ------ Careerfunction -------

function normalizeCareer(career) {
    return {
        id: career.id,
        title: career.Title || career.title || "Untitled",
        desc: career.Description || career.description || "",
        skills: career["required_skills"] || career.skills || career["Required Skills"] || [],
        education: career["Educational Path"] || career.education || career["educational_path"] || "-",
        salary: career["salary_range"] || career["Salary Range"] || career.salary,
        industry: career.Industry || career.industry || "-",
        img: career["Image/Icon"] || career.img || career["image_url"] || career["image"] || "https://via.placeholder.com/96x72?text=No+Image"
    };
}


function loadCareers(type) {
    currentType = type;
    const path = categoryConfig[type];
    if (!path) {
        console.error("No path found for type:", type);
        return;
    }

    fetch(path)
        .then(res => res.json())
        .then(data => {
          
            allCareers = data.map(c => ({ ...normalizeCareer(c), type })); 
            populateIndustryFilter(type);
            renderCareers(allCareers);
        })
        .catch(err => console.error("Error loading careers:", err));
}

function renderCareers(list) {
    const container = document.getElementById('careerList');
    if (!container) return;

    container.innerHTML = '';
    const allBookmarks = JSON.parse(localStorage.getItem('nsn_bookmarks_v1') || '[]');
    const userBookmarks = allBookmarks.filter(b => b.userEmail === state.userEmail);

    list.forEach(c => {
        const isBookmarked = userBookmarks.some(b => b.id === c.id && b.kind === 'career');
        const card = document.createElement('div');
        card.className = 'career-card';
        card.innerHTML = `
            <img src="${c.img}" alt="${c.title}">
            <div class="career-card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <h5>${c.title}</h5>
                    <span class="badge bg-light text-muted">${c.industry}</span>
                </div>
                <p class="small-muted mb-1">${c.desc}</p>
                <div class="small-muted mb-2">Education: ${c.education}</div>
                <div class="small-muted mb-2">Salary: ${c.salary}</div>
                <div>Skills: ${c.skills.join(', ')}</div>
                <div class="d-flex gap-2 mt-auto">
                    <button class="btn btn-sm btn-accent add-bookmark" data-id="${c.id}">
                        ${isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                    </button>
                    <button class="btn btn-sm btn-outline-secondary view-detail" data-id="${c.id}">View</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    
    document.querySelectorAll('.add-bookmark').forEach(b => b.addEventListener('click', e => {
        const id = Number(e.currentTarget.dataset.id);
        toggleBookmark('career', id,currentType);
    }));

    document.querySelectorAll('.view-detail').forEach(b => b.addEventListener('click', e => {
        const id = Number(e.currentTarget.dataset.id);
        viewCareer(id);
    }));
}

function viewCareer(id) {
    const item = allCareers.find(c => c.id === id);
    if (!item) return;

    state.recentlyViewed.unshift({ type: 'career', id: item.id, title: item.title });
    if (state.recentlyViewed.length > 10) state.recentlyViewed.pop();

    alert(`${item.title}\n\n${item.desc}\n\nEducation: ${item.education}\nSkills: ${item.skills.join(', ')}\nSalary: ${item.salary_min} - ${item.salary_max}`);
}


function populateIndustryFilter(type) {
    
    const dropdown = document.getElementById(`filterIndustry${capitalize(type)}`);
    if (!dropdown) return;

    const industries = ['all', ...new Set(allCareers.filter(c => c.type===type).map(c => c.industry))];

    dropdown.innerHTML = '';
    industries.forEach(i => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        dropdown.appendChild(opt);
    });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


const quizConfig = {
  "students": "./quizzes/students.json",
  "undergraduate": "./quizzes/undergraduate.json",
  "graduate": "./quizzes/graduates.json",
  "professional": "./quizzes/professional.json"
};

function loadQuizzes(userType) {
  const path = quizConfig[userType];
  if (!path) {
    console.error("No quiz path found for type:", userType);
    return;
  }

  fetch(path)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        console.error("Quiz data is not an array:", data);
        return;
      }
      DATA.quizzes = data;
      console.log("Quizzes loaded:", DATA.quizzes);
      renderQuizUI();
    })
    .catch(err => console.error("Error loading quizzes:", err));
}

function renderQuizUI() {
  const select = document.getElementById('quizInterest');
  if (!select) {
    console.error("No <select> element with id 'quizInterest' found!");
    return;
  }

  if (!DATA.quizzes || DATA.quizzes.length === 0) {
    console.warn("No quizzes available to render.");
    select.innerHTML = `<option disabled>No quizzes available</option>`;
    return;
  }

  select.innerHTML = '';
  DATA.quizzes.forEach(q => {
    const opt = document.createElement('option');
    opt.value = q.interest;
    opt.textContent = q.interest.charAt(0).toUpperCase() + q.interest.slice(1);
    select.appendChild(opt);
  });
}

function startQuiz() {
  const interest = document.getElementById('quizInterest')?.value;
  if (!interest) return alert("Please select an interest!");

  const q = DATA.quizzes.find(x => x.interest === interest);
  if (!q) return alert("No quiz found for this interest.");

  const area = document.getElementById('quizArea');
  if (!area) return console.error("No quiz area found.");
  area.innerHTML = '';


  q.questions.forEach((qq, idx) => {
    const div = document.createElement('div');
    div.className = 'mb-3';
    div.innerHTML = `<label class="form-label">${idx + 1}. ${qq.q}</label>`;

    qq.options.forEach((opt, i) => {
      const id = `q_${idx}_${i}`;
      const radio = document.createElement('div');
      radio.className = 'form-check';
      radio.innerHTML = `
        <input class="form-check-input" type="radio" name="q_${idx}" id="${id}" value="${opt.v}">
        <label class="form-check-label" for="${id}">${opt.t}</label>
      `;
      div.appendChild(radio);
    });

    area.appendChild(div);
  });

  const submit = document.createElement('button');
  submit.className = 'btn btn-accent mt-3';
  submit.textContent = 'Get Recommendation';

  submit.addEventListener('click', () => {
    let score = 0;

    q.questions.forEach((qq, idx) => {
      const v = document.querySelector(`input[name=q_${idx}]:checked`);
      if (v) score += Number(v.value);
    });

    const res = score >= (q.questions.length * 2 - 1)
      ? q.recommendations[0]
      : q.recommendations[1] || q.recommendations[0];

    const resultDiv = document.getElementById('quizResult');
    if (!resultDiv) return console.error("No quiz result area found.");
    resultDiv.innerHTML = '';

    const matches = allCareers.filter(c =>
      c.title.toLowerCase() === res.toLowerCase() ||
      (Array.isArray(q.recommendations) && q.recommendations.map(r => r.toLowerCase()).includes(c.title.toLowerCase()))
    );

  if (matches.length > 0) {
    matches.forEach(matchedCareer => {
      const card = document.createElement('div');
      card.className = 'career-card';
      card.innerHTML = `
        <img src="${matchedCareer.img}" alt="${matchedCareer.title}">
        <div class="career-card-body">
          <h5>${matchedCareer.title}</h5>
          <p class="small-muted">${matchedCareer.desc}</p>
          <div class="small-muted">Education: ${matchedCareer.education}</div>
          <div class="small-muted">Salary: ${matchedCareer.salary}</div>
          <div>Skills: ${matchedCareer.skills.join(', ')}</div>
          <button class="btn btn-sm btn-accent view-detail" data-id="${matchedCareer.id}">View</button>
        </div>
      `;
      resultDiv.appendChild(card);

      
      const viewBtn = card.querySelector('.view-detail');
      if (viewBtn && typeof viewCareer === 'function') {
        viewBtn.addEventListener('click', () => viewCareer(matchedCareer.id));
      }
    });
  } else {
    
  resultDiv.innerHTML = `
    <div class="alert alert-success">
      Recommended path: <strong>${res}</strong>
    </div>`;
    }
  });

  area.appendChild(submit);
}
// -------quiz ended

function renderRelated(list) {
    const r = document.getElementById('relatedCareers');
    if (!r) return;
    r.innerHTML = '';
    list.forEach(c => {
        const span = document.createElement('div');
        span.className = 'chip';
        span.textContent = c.title;
        r.appendChild(span);
    });
}

function setupSlider() {
  const imageSlider = document.getElementById("image-slider");
  const buttons = document.querySelectorAll(".img-btn");

  if (!imageSlider || buttons.length === 0) return;

  const slideImages = Array.from(buttons).map(btn => btn.getAttribute("data-src"));
  let currentIndex = 0;
  let interval;

  function updateSlide(index) {
    buttons.forEach(btn => btn.classList.remove("active"));
    buttons[index].classList.add("active");

    imageSlider.style.opacity = 0;
    setTimeout(() => {
      imageSlider.src = slideImages[index];
      imageSlider.style.opacity = 1;
    }, 200);
  }

  function autoSlide() {
    currentIndex = (currentIndex + 1) % slideImages.length;
    updateSlide(currentIndex);
  }

  function startAutoSlide() {
    interval = setInterval(autoSlide, 5000); 
  }

  function stopAutoSlide() {
    clearInterval(interval);
  }

  buttons.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      stopAutoSlide();
      currentIndex = index;
      updateSlide(currentIndex);
      startAutoSlide(); 
    });
  });

  
  startAutoSlide();
}

// --------------bookmarks in  Cards -----
function getBookmarkKey() {
    const user = JSON.parse(localStorage.getItem('rememberedUser') || '{}');
    return user?.email ? `nsn_bookmarks_${user.email}` : 'nsn_bookmarks_guest';
}

function toggleBookmark(kind, id) {
    const allBookmarks = JSON.parse(localStorage.getItem('nsn_bookmarks_v1') || '[]');
    const existingIndex = allBookmarks.findIndex(b => b.id === id && b.userEmail === state.userEmail && b.kind === kind);

    if (existingIndex !== -1) {
        allBookmarks.splice(existingIndex, 1);
    } else {
        const career = allCareers.find(c => c.id === id);
        if (!career) return alert(`${kind} not found`);

        allBookmarks.push({
            id: career.id,
            kind,
            userEmail: state.userEmail,
            title: career.title,
            salary: career.salary,
            img: career.img,
            industry: career.industry,
            skills: career.skills,
            desc: career.desc,
            education: career.education
            
        });
    }

    localStorage.setItem('nsn_bookmarks_v1', JSON.stringify(allBookmarks));

    renderCareers(allCareers); 
    renderBookmarks();          
}


function renderBookmarks() {
    const container = document.getElementById('bookmark');
    if (!container) return;

    const allBookmarks = JSON.parse(localStorage.getItem('nsn_bookmarks_v1') || '[]');
    const userBookmarks = allBookmarks.filter(b => b.userEmail === state.userEmail);

    container.innerHTML = '';

    if (userBookmarks.length === 0) {
        container.innerHTML = `<p>No bookmarks yet!</p>`;
        return;
    }

   userBookmarks.forEach(b => {
      const card = document.createElement('div');
      card.className = 'career-card';
      card.innerHTML = `
        <img src="${b.img || 'placeholder.jpg'}" alt="${b.title}">
        <div class="career-card-body">
            <div class="d-flex justify-content-between align-items-center">
                <h5>${b.title}</h5>
                <span class="badge bg-light text-muted">${b.industry}</span>
            </div>
            <div>Skills: ${b.skills.join(', ')}</div>
            <div class="small-muted mb-2">Education: ${b.education}</div>
            <div class="small-muted mb-2">Salary: ${b.salary }</div>
            <div class="d-flex gap-2 mt-auto">
                <button class="btn btn-sm btn-accent remove-bookmark" data-id="${b.id}">
                    Remove Bookmark
                </button>
                <button class="btn btn-sm btn-outline-secondary view-detail" data-id="${b.id}">View</button>
            </div>
        </div>
        `;
   container.appendChild(card);
  });

   
    document.querySelectorAll('.remove-bookmark').forEach(btn => {
        btn.addEventListener('click', e => {
            const id = Number(e.currentTarget.dataset.id);
            toggleBookmark('career', id);
            renderBookmarks();
        });
    });
    document.querySelectorAll('.view-detail').forEach(b => b.addEventListener('click', e => {
        const id = Number(e.currentTarget.dataset.id);
        viewCareer(id);
    }));
}


// -------------Media ,Stories , Resources ------------
function renderMedia(list) {
    const container = document.getElementById('mediaList');
    if (!container) return;
    container.innerHTML = '';
    list.forEach(m => {
        const col = document.createElement('div'); col.className='col-md-6 mb-3';
        col.innerHTML = `<div class="card card-body card-custom"><h6>${m.title}</h6><p class="small-muted">${m.desc}</p><div style="aspect-ratio:16/9"><iframe src="${m.url}" title="${m.title}" style="width:100%;height:100%;border:0" allowfullscreen></iframe></div></div>`;
        container.appendChild(col);
    });
}

function renderStories(list) {
    const c = document.getElementById('storiesList'); if(!c) return; c.innerHTML='';
    list.forEach(s => {
        const col = document.createElement('div'); col.className='col-md-6 mb-3';
        col.innerHTML=`<div class="card card-body card-custom d-flex gap-3">
            <img src="${s.img}" alt="${s.name}" style="width:84px;height:84px;object-fit:cover;border-radius:8px">
            <div>
                <h6>${s.name}</h6>
                <div class="small-muted">${s.domain}</div>
                <p class="small-muted">${s.summary}</p>
                <button class="btn btn-sm btn-accent-outline share-story" data-id="${s.id}">Share</button>
            </div>
        </div>`;
        c.appendChild(col);
    });
}

function setupLanding() {
    const btn = document.getElementById('exploreBtn');
    if(!btn) return;
    btn.addEventListener('click', ()=>{
        const name = document.getElementById('username')?.value.trim();
        const email = document.getElementById('userEmail')?.value.trim();
        const type = document.getElementById('userType')?.value;
        if(!name || !email) return alert('Enter name and email first.');
        loadHomepage(name);
        if(type) loadCareers(type);
    });
}

function applyCareerFilters(type) {
    const industryDropdown = document.getElementById(`filterIndustry${capitalize(type)}`);
    const sortDropdown = document.getElementById('sortCareer');

    if (!industryDropdown || !sortDropdown) return;

    let filtered = allCareers.filter(c => c.type === type);
    const industry = industryDropdown.value.toLowerCase();
    if (industry !== 'all') {
        filtered = filtered.filter(c => c.industry.toLowerCase() === industry);
    }

    const sortBy = sortDropdown.value;
    if (sortBy === 'alpha') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'salaryAsc') {
        filtered.sort((a, b) => parseSalary(a.salary) - parseSalary(b.salary));
    } else if (sortBy === 'salaryDesc') {
        filtered.sort((a, b) => parseSalary(b.salary) - parseSalary(a.salary));
    }

    renderCareers(filtered);
}

function parseSalary(s) {
    if (!s) return 0;
    if (typeof s === 'number') return s;
    const match = s.match(/\d+/g);
    if (!match) return 0;
    return Number(match[0]); 
}

['Undergraduate', 'Graduate', 'Students', 'Professional'].forEach(type => {
    const dropdown = document.getElementById(`filterIndustry${type}`);
    if (dropdown) dropdown.addEventListener('change', () => applyCareerFilters(type));
});
document.getElementById('sortCareer')?.addEventListener('change', () => applyCareerFilters(currentType));


// ------------ UTILITY  ----------
const $ = (s, ctx=document)=>ctx.querySelector(s);
const $$ = (s, ctx=document)=>Array.from(ctx.querySelectorAll(s));

const state = { userType:'students', username:'', recentlyViewed:[] };

function setupClock() {
    function tick(){ $('#clock').textContent=new Date().toLocaleTimeString(); }
    tick(); setInterval(tick,1000);
}

function setupGeo() {
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(pos=>{
            $('#location').textContent=`Location: ${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`;
        },()=>{$('#location').textContent='Location: unavailable';});
    } else { $('#location').textContent='Location: not supported'; }
}

function simulateVisitor() {
    const key='nsn_visitors_v1';
    let n=Number(localStorage.getItem(key)||1245);
    n+=Math.floor(Math.random()*3+1);
    localStorage.setItem(key,n);
    $('#visitor').textContent=n.toLocaleString();
}

// ------------int----------
function bindFilters(){
    $('#filterIndustry')?.addEventListener('change', applyCareerFilters);
    $('#sortCareer')?.addEventListener('change', applyCareerFilters);
    $('#mediaFilter')?.addEventListener('change', ()=>{
        renderMedia(DATA.media.filter(m=> $('#mediaFilter').value==='all'||m.category===$('#mediaFilter').value ));
    });
    $('#startQuiz')?.addEventListener('click', startQuiz);
}

function bindFeedback(){
    $('#feedbackForm')?.addEventListener('submit', e=>{
        e.preventDefault();
        alert(' message recorded locally.');
    });
}

// ------------status of teams --------------------
async function updateStatuses() {
  try {
    const response = await fetch('./data/team-schedule.json');
    const scheduleData = await response.json();

    const now = new Date();
    const day = now.getDay(); 
    const currentHour = now.getHours() + now.getMinutes() / 60;

    document.querySelectorAll('.status').forEach(span => {
      const name = span.dataset.name?.trim();
      const schedule = scheduleData[name];

      if (!schedule) {
        span.textContent = '● Offline';
        span.classList.remove('online');
        span.classList.add('offline');
        return;
      }   
      let hours = (day >= 1 && day <= 5) ? schedule.monToFri : schedule.satSun;

      if (!hours || hours[0].toLowerCase() === 'off' || hours[1].toLowerCase() === 'off') {
        span.textContent = '● Offline';
        span.classList.remove('online');
        span.classList.add('offline');
        return;
      }

      const [start, end] = hours.map(time => {
        const [h, m] = time.split(':').map(Number);
        return h + (m || 0) / 60;
      });

      const online = currentHour >= start && currentHour <= end;
      span.textContent = online ? '● Online' : '● Offline';
      span.classList.remove('online','offline');
      span.classList.add(online ? 'online' : 'offline');
    });
  } catch (err) {
    console.error('Failed to load schedule data:', err);
  }
}

function bindContactStatus() {
  const contactButtons = document.querySelectorAll('[data-tab="contact"], #scroll-to-contact');
  
  contactButtons.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();

      showTab?.('contact');
      document.getElementById('contact')?.classList.remove('d-none');

      setTimeout(updateStatuses, 50);
      const contact = document.getElementById('contact');
      if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
let allMultimedia = [];     
let currentMultimediaType = null;  

const multimediaConfig = {
    "students": "./multimedia/school.json",
    "undergraduate": "./multimedia/undergrad.json",
    "graduate": "./multimedia/graduate.json",
    "professional": "./multimedia/professional.json"
};


function normalizeMultimedia(item) {
  return {
    id: item.id || null,
    title: item.title || item.Title || "Untitled",
    description: item.description || item.Description || "",
    category: (item.category || item.Category || "uncategorized").toLowerCase(),
    type: (item.type || item.Type || "article").toLowerCase(), // lowercase type
    url: item.url || item.URL || item.Url || "#"
  };
}

function loadMultimedia(type) {
    currentMultimediaType = type;
    const path = multimediaConfig[type];
    if (!path) {
        console.error("No path for multimedia type:", type);
        return;
    }

    fetch(path)
        .then(res => res.json())
        .then(data => {
            allMultimedia = data.map(m => normalizeMultimedia(m));
            renderMultimedia(allMultimedia);
            bindMultimediaFilters(); 
        })
        .catch(err => console.error("Error loading multimedia:", err));
}

function bindMultimediaFilters() {
    const buttons = document.querySelectorAll('#multimedia .filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
           
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.dataset.category;

            if (category === 'all') {
                renderMultimedia(allMultimedia);
            } else {
                renderMultimedia(allMultimedia.filter(m => m.category === category));
            }
        });
    });
}


function renderMultimedia(list) {
    const container = document.getElementById('multimediaGrid');
    if (!container) return;

    container.innerHTML = '';
    if (!list.length) {
        container.innerHTML = `<div class="col-12 text-center">No multimedia available for this category.</div>`;
        return;
    }

    list.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';

        let mediaContent = '';
        if (item.type === 'video') {
            mediaContent = `<iframe width="100%" height="200" src="${item.url}" frameborder="0" allowfullscreen></iframe>`;
        } else if (item.type === 'podcast') {
            mediaContent = `<audio controls class="w-100"><source src="${item.url}" type="audio/mpeg">Your browser does not support audio</audio>`;
        } else if (item.type === 'article') {
            mediaContent = `<a href="${item.url}" target="_blank" class="btn btn-sm" 
                style="border:1px solid #225a59; background-color:#225a59; color:#fff; border-radius:6px; padding:0.4rem 0.8rem; transition:all 0.3s ease;">
                Read Article</a>`;
        }

        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${item.title}</h5>
                    <p class="card-text small">${item.description}</p>
                    ${mediaContent}
                </div>
                <div class="card-footer small">${item.category}</div>
            </div>
        `;
        container.appendChild(col);
    });
}


function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function setupMultimedia() {
    ['students', 'undergraduate', 'graduate', 'professional'].forEach(type => {
        const dropdown = document.getElementById(`multimediaFilter${capitalize(type)}`);
        dropdown?.addEventListener('change', () => applyMultimediaFilters(type));
    });
}

// --- Feedback ---
function bindFeedback() {
  const form = document.querySelector('#feedback form');
  const submitBtn = form.querySelector('button[type="button"]');

  if (!form || !submitBtn) return;

  submitBtn.addEventListener('click', () => {
    const name = form.querySelector('input[type="text"]').value.trim();
    const email = form.querySelector('input[type="email"]').value.trim();
    const topic = form.querySelector('select').value;
    const message = form.querySelector('textarea').value.trim();

    if (!name) {
      alert("Please enter your name.");
      form.querySelector('input[type="text"]').focus();
      return;
    }

    if (!validateEmail(email)) {
      alert("Please enter a valid email address.");
      form.querySelector('input[type="email"]').focus();
      return;
    }

    if (!topic) {
      alert("Please select a topic.");
      form.querySelector('select').focus();
      return;
    }

    if (!message) {
      alert("Please enter your message.");
      form.querySelector('textarea').focus();
      return;
    }

    alert("Thank you for your feedback! We appreciate it.");
    form.reset();
  });

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
}



const storiesConfig = {
  "students": "./stories/students.json",
  "undergraduate": "./stories/undergraduate.json",
  "graduate": "./stories/graduate.json",
  "professional": "./stories/professional.json"
};

function loadStories(userType) {
  const path = storiesConfig[userType];
  if (!path) {
    console.error("No stories path found for type:", userType);
    return;
  }

  fetch(path)
    .then(res => res.json())
    .then(data => {
      displayStories(data); 
    })
    .catch(err => console.error("Error loading stories:", err));
}


function displayStories(stories) {
  const storiesList = document.getElementById("storiesList");
  storiesList.innerHTML = "";

  if (!stories || stories.length === 0) {
    storiesList.innerHTML = "<p>No stories found for this category.</p>";
    return;
  }

  stories.forEach(story => {
    const card = document.createElement("div");
    card.className = "col-md-6";

    card.innerHTML = `
    <div class="card card-body story-card h-100">
      <div class="d-flex gap-3">
        <img src="${story.img}" alt="${story.name}">
        <div>
          <h6 class="mb-1">${story.name}</h6>
          <div class="small-muted">${story.field}</div>
          <p class="small-muted mb-2">${story.story.substring(0, 80)}...</p>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-accent">Share</button>
            <button class="btn btn-sm btn-accent read-more" 
              data-id="${story.id}" 
              data-name="${story.name}" 
              data-field="${story.field}" 
              data-img="${story.img}" 
              data-story="${story.story}">
              Read More
            </button>
          </div>
        </div>
      </div>
    </div>
    `;
    storiesList.appendChild(card);
  });

  document.querySelectorAll(".read-more").forEach(btn => {
    btn.addEventListener("click", e => {
      const s = e.currentTarget.dataset;
      openStoryModal(s);
    });
  });
}

function openStoryModal(story) {
  const modalTitle = document.getElementById("storyModalLabel");
  const modalBody = document.getElementById("storyModalBody");

  modalTitle.textContent = `${story.name} – ${story.field}`;
  modalBody.innerHTML = `
    <img src="${story.img}" alt="${story.name}" class="img-fluid rounded mb-3" style="max-height:200px; object-fit:cover;">
    <p>${story.story}</p>
  `;

  const storyModal = new bootstrap.Modal(document.getElementById("storyModal"));
  storyModal.show();
}

// ------------resources--------------
const resourcesConfig = {
  "students": "resources/students.json",
  "undergraduate": "resources/undergraduate.json",
  "graduate": "resources/graduate.json",
  "professional": "resources/professional.json"
};

function loadResources(userType) {
  const path = resourcesConfig[userType];
  if (!path) {
    console.error("No resources path found for type:", userType);
    return;
  }

  fetch(path)
    .then(res => res.json())
    .then(data => {
      displayResources(data);
    })
    .catch(err => console.error("Error loading resources:", err));
}

function displayResources(resources) {
  const resourcesList = document.getElementById("resourcesList");
  resourcesList.innerHTML = "";

  if (!resources || resources.length === 0) {
    resourcesList.innerHTML = `<p class="text-muted">No resources found for this category.</p>`;
    return;
  }

  const row = document.createElement("div");
  row.className = "row g-3"; 

  resources.forEach(resource => {
    const card = document.createElement("div");
    card.className = "col-12 col-md-6"; 

    const imgSrc = resource.img || "images/resources/default.jpg";
    const title = resource.title || "Untitled Resource";
    const type = resource.type || "General";
    const desc = resource.description || "No description available.";
    const shortDesc = desc.length > 80 ? desc.substring(0, 80) + "..." : desc;
    const link = resource.link || "#";

    card.innerHTML = `
      <div class="card card-body resource-card h-100 shadow-sm">
        <div class="d-flex gap-3 flex-wrap">
          <img src="${imgSrc}" alt="${title}" class="img-fluid rounded" style="max-width:120px; object-fit:cover;">
          <div class="flex-grow-1">
            <h6 class="mb-1">${title}</h6>
            <div class="text-muted small">${type}</div>
            <p class="text-muted small mb-2">${shortDesc}</p>
            <div class="d-flex flex-wrap gap-2">
              <a href="${link}" target="_blank" class="btn btn-sm btn-outline-accent">
                <i class="bi bi-box-arrow-up-right"></i> Open
              </a>
              <button class="btn btn-sm btn-accent read-resource"
                data-title="${title}"
                data-type="${type}"
                data-img="${imgSrc}"
                data-description="${desc}"
                data-link="${link}">
                <i class="bi bi-book"></i> Read More
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    row.appendChild(card);

  });

  resourcesList.appendChild(row);

  
  document.querySelectorAll(".read-resource").forEach(btn => {
    btn.addEventListener("click", e => {
      const r = e.currentTarget.dataset;
      openResourceModal(r);
    });
  });
}

function openResourceModal(resource) {
  const modalTitle = document.getElementById("resourceModalLabel");
  const modalBody = document.getElementById("resourceModalBody");

  const title = resource.title || "Untitled";
  const type = resource.type || "Resource";
  const img = resource.img || "images/resources/default.jpg";
  const description = resource.description || "No description available.";
  const link = resource.link || "#";

  modalTitle.textContent = `${title} - ${type}`;
  modalBody.innerHTML = `
    <img src="${img}" alt="${title}" class="img-fluid rounded mb-3" style="max-height:200px; object-fit:cover;">
    <p>${description}</p>
    <a href="${link}" target="_blank" class="btn btn-primary">Open Resource</a>
  `;

  const resourceModal = new bootstrap.Modal(document.getElementById("resourceModal"));
  resourceModal.show();
}
// <!-- ================= resources  ================= -->


setInterval(() => {
  const contact = document.getElementById('contact');
  if (contact && !contact.classList.contains('d-none')) {
    updateStatuses();
  }
}, 5*60*1000);

document.addEventListener('click', function (e) {
 
  const btn = e.target.closest('#scroll-to-contact, [data-scroll-to="contact"]');
  if (!btn) return;

  e.preventDefault();

  if (typeof showTab === 'function') {
    showTab('contact');
  } else {
    
    const contact = document.getElementById('contact');
    if (contact) contact.classList.remove('d-none');
  }

  
  const contact = document.getElementById('contact');
  if (!contact) return;

  
  setTimeout(() => {
    try {
      contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      
      contact.scrollIntoView();
    }
  }, 60);
});
window.addEventListener('DOMContentLoaded', ()=>{
    setupNavbar();
    setupLanding();
    setupSlider();
    setupClock();
    setupGeo();
    simulateVisitor();
    bindFilters();
    bindFeedback();
    bindContactStatus();
    bindMultimediaFilters();

    ['undergraduate','graduate','students','professional'].forEach(type=>{
      const dropdown = document.getElementById(`filterIndustry${capitalize(type)}`);
      dropdown?.addEventListener('change', ()=>applyCareerFilters(type));
   });

});
