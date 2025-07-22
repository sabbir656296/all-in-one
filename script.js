/**
 * This script handles the entire functionality of the question bank application,
 * including data fetching, rendering UI components, and handling user interactions.
 *
 * Contents:
 * 1. Global State and Variables
 * 2. Application Initialization
 * 3. UI Rendering Functions
 * 4. Event Handlers and Logic
 * 5. Utility Functions
 * ==========================================================================
 */

// --------------------------------------------------------------------------
// 1. Global State and Variables
// --------------------------------------------------------------------------

// একটি অবজেক্ট যা পুরো অ্যাপ্লিকেশনের ডেটা সংরক্ষণ করবে।
// This object will store all the data for the application.
let allData = {};

// চার্ট ইনস্ট্যান্স সংরক্ষণের জন্য।
// To store the chart instance.
let topicChart;

// অ্যাপ্লিকেশনের বর্তমান অবস্থা (যেমন কোন বিষয়, বছর, বা প্রশ্নের ধরন নির্বাচিত) ট্র্যাক করার জন্য।
// To track the current state of the application (e.g., selected subject, year, or question type).
let currentState = {
    subject: null,
    year: null,
    type: 'written',
    noteCategory: null,
    noteSubject: null
};


// --------------------------------------------------------------------------
// 2. Application Initialization
// --------------------------------------------------------------------------

/**
 * এই ইভেন্টটি DOM লোড হওয়ার সাথে সাথে কাজ শুরু করে।
 * এটি প্রথমে data.json ফাইল থেকে ডেটা নিয়ে আসে এবং তারপর initializeApp() ফাংশনকে কল করে।
 * This event fires as soon as the DOM is loaded.
 * It first fetches data from data.json and then calls the initializeApp() function.
 */
document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            allData = data; // লোড হওয়া ডেটা allData ভেরিয়েবলে সংরক্ষণ
            initializeApp(); // ডেটা লোড হওয়ার পর মূল অ্যাপ চালু হবে
        })
        .catch(error => console.error('Error loading data:', error));
});

/**
 * এই ফাংশনটি পুরো অ্যাপ্লিকেশনটি চালু করে।
 * এটি বিভিন্ন UI উপাদান খুঁজে বের করে এবং তাদের জন্য ইভেন্ট লিসেনার সেট করে।
 * This function initializes the entire application.
 * It finds various UI elements and sets up event listeners for them.
 */
function initializeApp() {
    // DOM Elements
    const subjectNav = document.getElementById('subject-nav');
    const yearFilter = document.getElementById('year-filter');
    const homeButton = document.getElementById('home-button');
    const themeToggle = document.getElementById('theme-toggle');

    // Initial Render
    if (subjectNav) {
        renderNav(subjectNav);
    }

    // Event Listeners
    if (homeButton) {
        homeButton.onclick = showHomePage;
    }

    if (yearFilter) {
        yearFilter.onchange = handleYearChange;
    }

    if (themeToggle) {
        themeToggle.addEventListener('change', handleThemeToggle);
    }

    // Apply initial theme
    applyTheme();
    showHomePage(); // Initially show the home page
}


// --------------------------------------------------------------------------
// 3. UI Rendering Functions
// --------------------------------------------------------------------------

/**
 * ডেটা থেকে বিষয়গুলির জন্য নেভিগেশন বাটন তৈরি করে।
 * Creates navigation buttons for subjects from the data.
 */
function renderNav(subjectNav) {
    subjectNav.innerHTML = ''; // Clear existing buttons
    Object.keys(allData).forEach(key => {
        const subject = allData[key];
        const button = document.createElement('button');
        button.className = 'nav-button py-2 px-5 rounded-full font-semibold flex items-center gap-2';
        button.innerHTML = `<span>${subject.icon}</span> <span>${subject.name}</span>`;
        button.dataset.subject = key;
        button.onclick = () => selectSubject(key);
        subjectNav.appendChild(button);
    });
}

/**
 * নির্বাচিত বিষয়ের উপর ভিত্তি করে ফিল্টার অপশন (বছর এবং প্রশ্নের ধরন) রেন্ডার করে।
 * Renders filter options (year and question type) based on the selected subject.
 */
function renderFilters() {
    const subjectData = allData[currentState.subject];
    const yearFilter = document.getElementById('year-filter');
    const typeFilter = document.getElementById('type-filter');

    // Populate Year Filter
    yearFilter.innerHTML = '';
    subjectData.years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
    yearFilter.value = currentState.year;

    // Populate Type Filter
    typeFilter.innerHTML = '';
    const types = [{ key: 'written', name: 'লিখিত' }, { key: 'mcq', name: 'MCQ' }];
    types.forEach(type => {
        const button = document.createElement('button');
        button.className = 'filter-button py-2 px-4 rounded-md text-sm font-medium';
        button.textContent = type.name;
        button.dataset.type = type.key;
        button.classList.toggle('active', type.key === currentState.type);
        button.onclick = () => handleTypeChange(type.key);
        typeFilter.appendChild(button);
    });
}

/**
 * নির্বাচিত বিষয় এবং বছরের উপর ভিত্তি করে প্রশ্নগুলো প্রদর্শন করে।
 * Displays questions based on the selected subject and year.
 */
function renderQuestions() {
    const questionDisplay = document.getElementById('question-display');
    questionDisplay.innerHTML = '';

    const { subject, year, type } = currentState;
    const questions = allData[subject]?.questions[year]?.[type] || [];
    
    updateMCQResultVisibility(type, questions.length);

    if (questions.length === 0) {
        questionDisplay.innerHTML = `<div class="text-center text-zinc-500 p-8 card rounded-lg fade-in">এই সেকশনে কোনো প্রশ্ন পাওয়া যায়নি।</div>`;
        return;
    }

    questions.forEach((item, index) => {
        let element;
        if (type === 'written') {
            element = createWrittenQuestionElement(item, index);
        } else if (type === 'mcq') {
            element = createMCQElement(item, index);
        }
        if(element) questionDisplay.appendChild(element);
    });
}

/**
 * ক্লাস নোট বিভাগের জন্য UI রেন্ডার করে।
 * Renders the UI for the class notes section.
 */
function renderClassNotesView(noteCategoryKey) {
    const questionDisplay = document.getElementById('question-display');
    const classnotesFilters = document.getElementById('classnotes-filters');
    
    questionDisplay.innerHTML = '';
    classnotesFilters.innerHTML = '';

    const noteSubjects = allData[noteCategoryKey].subjects;
    const subjectButtonsContainer = document.createElement('div');
    subjectButtonsContainer.className = 'flex flex-wrap justify-center gap-3';
    subjectButtonsContainer.id = 'note-subject-buttons';

    Object.keys(noteSubjects).forEach(subjectKey => {
        const subjectInfo = allData[subjectKey];
        if (!subjectInfo) return;

        const button = document.createElement('button');
        button.className = 'filter-button py-2 px-4 rounded-md text-sm font-medium flex items-center gap-2';
        button.innerHTML = `<span>${subjectInfo.icon}</span> <span>${subjectInfo.name}</span>`;
        button.dataset.subjectKey = subjectKey;
        button.onclick = () => displayNotesForSubject(noteCategoryKey, subjectKey);
        subjectButtonsContainer.appendChild(button);
    });
    
    classnotesFilters.appendChild(subjectButtonsContainer);

    // প্রথম নোটটি ডিফল্টভাবে দেখানোর জন্য
    const firstSubjectKey = Object.keys(noteSubjects)[0];
    if (firstSubjectKey) {
        displayNotesForSubject(noteCategoryKey, firstSubjectKey);
    }
}


/**
 * বিষয়ভিত্তিক প্রশ্নের পরিসংখ্যান দেখানোর জন্য একটি বার চার্ট রেন্ডার করে।
 * Renders a bar chart to show statistics of questions by topic.
 */
function renderChart() {
    const ctx = document.getElementById('topicChart').getContext('2d');
    if (topicChart) {
        topicChart.destroy();
    }

    const analysisData = allData[currentState.subject]?.analysis;
    if (!analysisData) return;

    const isDarkMode = document.body.classList.contains('dark');
    const gridColor = isDarkMode ? 'rgba(228, 228, 231, 0.2)' : 'rgba(228, 228, 231, 0.7)';
    const tickColor = isDarkMode ? '#a1a1aa' : '#52525b';
    
    topicChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: analysisData.labels,
            datasets: [{
                label: 'প্রশ্ন সংখ্যা',
                data: analysisData.data,
                backgroundColor: isDarkMode ? 'rgba(161, 161, 170, 0.6)' : 'rgba(113, 113, 122, 0.6)',
                borderColor: isDarkMode ? 'rgba(161, 161, 170, 1)' : 'rgba(113, 113, 122, 1)',
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'Hind Siliguri' } } },
                x: { grid: { display: false }, ticks: { color: tickColor, font: { family: 'Hind Siliguri' } } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#52525b',
                    titleFont: { family: 'Hind Siliguri' },
                    bodyFont: { family: 'Hind Siliguri' },
                    padding: 10,
                    cornerRadius: 5
                }
            }
        }
    });
}


// --------------------------------------------------------------------------
// 4. Event Handlers and Logic
// --------------------------------------------------------------------------

/**
 * একটি বিষয় নির্বাচন করার পর UI আপডেট করে।
 * এই ফাংশনটি নতুন করে লেখা হয়েছে যাতে চার্ট এবং ফিল্টার দেখানোর যুক্তি আরও স্পষ্ট হয়।
 * Updates the UI after a subject is selected.
 * This function has been rewritten to make the logic for showing the chart and filters clearer.
 */
function selectSubject(subjectKey) {
    currentState.subject = subjectKey;
    
    // Update active button style
    document.querySelectorAll('#subject-nav button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.subject === subjectKey);
    });

    const subjectData = allData[subjectKey];
    const isNote = subjectData.isNoteCategory;

    // Get references to the UI sections
    const introSection = document.getElementById('intro-section');
    const filterSection = document.getElementById('filter-section');
    const chartSection = document.getElementById('chart-section');
    const regularFilters = document.getElementById('regular-filters');
    const classnotesFilters = document.getElementById('classnotes-filters');

    // Hide the introduction
    introSection.classList.add('hidden');
    
    // Always show the main filter area container
    filterSection.classList.remove('hidden');

    if (isNote) {
        // This is a "Class Notes" type subject
        currentState.type = 'note';
        
        // Hide the sections for regular questions
        chartSection.classList.add('hidden');
        regularFilters.classList.add('hidden');
        
        // Show the section for note filters
        classnotesFilters.classList.remove('hidden');

        // Render the UI for notes
        renderClassNotesView(subjectKey);
    } else {
        // This is a regular question bank subject
        currentState.year = subjectData.years[0];
        currentState.type = 'written';
        
        // Show the chart
        chartSection.classList.remove('hidden');
        
        // Show the regular filters (Year, Type)
        regularFilters.classList.remove('hidden');
        
        // Hide the note filters
        classnotesFilters.classList.add('hidden');

        // Render the content
        renderFilters();
        renderChart();
        renderQuestions();
    }
}


/**
 * বছর পরিবর্তন হলে প্রশ্নগুলো পুনরায় রেন্ডার করে।
 * Re-renders the questions when the year is changed.
 */
function handleYearChange(event) {
    currentState.year = event.target.value;
    renderQuestions();
}

/**
 * প্রশ্নের ধরন (লিখিত/MCQ) পরিবর্তন হলে UI আপডেট করে।
 * Updates the UI when the question type (written/MCQ) is changed.
 */
function handleTypeChange(typeKey) {
    currentState.type = typeKey;
    document.querySelectorAll('#type-filter button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === typeKey);
    });
    renderQuestions();
}

/**
 * থিম (লাইট/ডার্ক) টগল করে এবং পরিবর্তন প্রয়োগ করে।
 * Toggles the theme (light/dark) and applies the changes.
 */
function handleThemeToggle(event) {
    localStorage.setItem('theme', event.target.checked ? 'dark' : 'light');
    applyTheme(true); // Pass true to indicate it's a manual toggle
}

/**
 * অ্যাকর্ডিয়ন আইটেমে ক্লিক করার পর তা খোলা বা বন্ধ করার ব্যবস্থা করে।
 * এই ফাংশনটি নতুন করে লেখা হয়েছে যাতে উচ্চতা নিয়ে কোনো সমস্যা না হয়।
 * Manages opening and closing of an accordion item on click.
 * This function has been rewritten to be more robust and avoid height calculation issues.
 */
function handleAccordionClick(accordionHeader, accordionBody) {
    const isOpening = !accordionHeader.classList.contains('active');

    // প্রথমে, সব অ্যাকর্ডিয়ন বন্ধ করে দিন। এটি একটি পরিষ্কার অবস্থা তৈরি করে।
    // First, close all accordions. This creates a clean state.
    document.querySelectorAll('.question-accordion-header.active').forEach(header => {
        if (header !== accordionHeader) {
            header.classList.remove('active');
            const body = header.nextElementSibling;
            body.style.maxHeight = null;
            body.style.paddingTop = '0';
            body.style.paddingBottom = '0';
            const otherIcon = header.querySelector('.transform_plus');
            if (otherIcon) otherIcon.textContent = '+';
        }
    });

    // যদি ক্লিক করা অ্যাকর্ডিয়নটি বন্ধ থাকে, তবে সেটিকে খুলুন।
    // If the clicked accordion was closed, open it.
    if (isOpening) {
        accordionHeader.classList.add('active');
        const icon = accordionHeader.querySelector('.transform_plus');
        if (icon) icon.textContent = '–';
        
        accordionBody.style.paddingTop = '1rem';
        accordionBody.style.paddingBottom = '1.5rem';
        
        // setTimeout ব্যবহার করে ব্রাউজারকে স্টাইল রেন্ডার করার জন্য সময় দেওয়া হচ্ছে।
        // Using setTimeout to give the browser a moment to render styles before calculating height.
        setTimeout(() => {
            accordionBody.style.maxHeight = accordionBody.scrollHeight + 'px';
        }, 0);

    } else {
        // যদি ক্লিক করা অ্যাকর্ডিয়নটি খোলা থাকে, তবে সেটিকে বন্ধ করুন।
        // If the clicked accordion was open, close it.
        accordionHeader.classList.remove('active');
        const icon = accordionHeader.querySelector('.transform_plus');
        if (icon) icon.textContent = '+';

        accordionBody.style.maxHeight = null;
        accordionBody.style.paddingTop = '0';
        accordionBody.style.paddingBottom = '0';
    }
}


/**
 * MCQ অপশনে ক্লিক করার পর সঠিক/ভুল উত্তর প্রদর্শন করে এবং স্কোর আপডেট করে।
 * Shows correct/incorrect answer and updates score after an MCQ option is clicked.
 */
function handleMCQOptionClick(optionEl, item, index) {
    const parentCard = optionEl.closest('.card');
    if (parentCard.dataset.answered) return; // Prevent re-answering

    parentCard.dataset.answered = 'true';
    parentCard.querySelectorAll('.mcq-option').forEach(el => {
        el.style.pointerEvents = 'none'; // Disable all options in this card
    });

    const correctOptionIndex = item.a;
    const selectedOptionIndex = Array.from(parentCard.querySelectorAll('.mcq-option')).indexOf(optionEl);
    
    const correctOptionEl = parentCard.querySelectorAll('.mcq-option')[correctOptionIndex];
    correctOptionEl.classList.add('correct');
    correctOptionEl.querySelector('.option-icon').textContent = '✔';

    if (selectedOptionIndex !== correctOptionIndex) {
        // Incorrect answer selected
        optionEl.classList.add('incorrect');
        optionEl.querySelector('.option-icon').textContent = '✖';
    }
    
    updateMCQScore();
}

/**
 * হোম পেজ প্রদর্শন করে এবং অ্যাপ্লিকেশনের অবস্থা রিসেট করে।
 * Displays the home page and resets the application state.
 */
function showHomePage() {
    document.getElementById('intro-section').classList.remove('hidden');
    document.getElementById('chart-section').classList.add('hidden');
    document.getElementById('filter-section').classList.add('hidden');
    document.getElementById('question-display').innerHTML = '';
    document.getElementById('mcq-result-section').classList.add('hidden');
    
    // Deactivate all nav buttons
    document.querySelectorAll('#subject-nav button').forEach(btn => btn.classList.remove('active'));
    
    // Reset state
    currentState = { subject: null, year: null, type: 'written', noteCategory: null, noteSubject: null };
}

/**
 * একটি নির্দিষ্ট বিষয়ের জন্য নোট প্রদর্শন করে।
 * Displays notes for a specific subject.
 */
function displayNotesForSubject(noteCategoryKey, subjectKey) {
    // Update active button
    document.querySelectorAll('#note-subject-buttons button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.subjectKey === subjectKey);
    });

    const questionDisplay = document.getElementById('question-display');
    questionDisplay.innerHTML = '';
    const notes = allData[noteCategoryKey].subjects[subjectKey] || [];

    if (notes.length === 0) {
        questionDisplay.innerHTML = `<div class="text-center text-zinc-500 p-8 card rounded-lg fade-in">অন্যের নোটের ভরসায় ক্লাস মিস করলে, পরীক্ষায় ব্রেইন থাকবে ফ্লাইট মোডে আর উত্তরপত্র থাকবে গ্রাউন্ডে!</div>`;
        return;
    }

    notes.forEach((note, index) => {
        const element = createNoteElement(note, index);
        questionDisplay.appendChild(element);
    });
}


// --------------------------------------------------------------------------
// 5. Utility Functions
// --------------------------------------------------------------------------

/**
 * প্রশ্নের টেক্সটের নির্দিষ্ট অংশকে বোল্ড করে ফরম্যাট করে।
 * Formats the question text by making specific parts bold.
 */
function formatQuestionText(text) {
    const regex = /(^(\d+\.|[০-৯]+\।)?\s*(\([a-zA-Z]\)|\([ক-ৎ]\))|^টীকা:|^(Or|অথবা),?:?|Explain with reference to the context:|Marks: \d+)/g;
    return text.replace(regex, '<strong>$&</strong>');
}

/**
 * localStorage থেকে থিম লোড করে এবং UI-তে প্রয়োগ করে।
 * Loads the theme from localStorage and applies it to the UI.
 */
function applyTheme(isToggle = false) {
    const isDark = localStorage.getItem('theme') === 'dark';
    document.body.classList.toggle('dark', isDark);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.checked = isDark;
    }
    
    // Re-render chart on theme toggle if it's visible
    const isChartVisible = currentState.subject && !allData[currentState.subject]?.isNoteCategory;
    if (isToggle && topicChart && isChartVisible) {
        renderChart();
    }
}

/**
 * MCQ স্কোর সেকশনটি দেখাবে কি না তা নিয়ন্ত্রণ করে।
 * Controls the visibility of the MCQ score section.
 */
function updateMCQResultVisibility(type, questionCount) {
    const mcqResultSection = document.getElementById('mcq-result-section');
    if (type === 'mcq' && questionCount > 0) {
        mcqResultSection.classList.remove('hidden');
        document.getElementById('mcq-score').textContent = '0';
        document.getElementById('mcq-total').textContent = questionCount;
    } else {
        mcqResultSection.classList.add('hidden');
    }
}

/**
 * বর্তমান সঠিক উত্তরের সংখ্যা গণনা করে এবং UI-তে প্রদর্শন করে।
 * Calculates the current number of correct answers and displays it in the UI.
 */
function updateMCQScore() {
    let userScore = 0;
    document.querySelectorAll('.card[data-answered="true"]').forEach(card => {
        const correctOption = card.querySelector('.mcq-option.correct');
        const selectedIncorrect = card.querySelector('.mcq-option.incorrect');
        // Score if the correct option was selected, which means there is no 'incorrect' class on any option in this card
        if (correctOption && !selectedIncorrect) {
            userScore++;
        }
    });
    document.getElementById('mcq-score').textContent = userScore;
}


/**
 * একটি লিখিত প্রশ্নের জন্য HTML এলিমেন্ট তৈরি করে।
 * Creates an HTML element for a written question.
 */
function createWrittenQuestionElement(item, index) {
    const accordionItem = document.createElement('div');
    accordionItem.className = 'card p-0 rounded-lg shadow-sm fade-in overflow-hidden';
    accordionItem.style.animationDelay = `${index * 40}ms`;

    const accordionHeader = document.createElement('button');
    accordionHeader.className = 'question-accordion-header';
    accordionHeader.innerHTML = `<span class="pr-4">${formatQuestionText(item.q)}</span><span class="text-2xl font-light transition-transform duration-300 transform_plus">+</span>`;
    
    const accordionBody = document.createElement('div');
    accordionBody.className = 'question-accordion-body';
    
    const answerWrapper = document.createElement('div');
    answerWrapper.className = 'answer-content prose max-w-none dark:prose-invert';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = item.a || "<p>উত্তর পাওয়া যায়নি।</p>";
    tempDiv.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));

    // *** নতুন সংশোধিত কোড শুরু ***
    // কন্টেন্টের ভেতরে থাকা টেবিলকে রেসপন্সিভ করার জন্য র‍্যাপার যুক্ত করা
    tempDiv.querySelectorAll('table').forEach(table => {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper'; // এই ক্লাসটি style.css এ ডিফাইন করা আছে
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
    // *** নতুন সংশোধিত কোড শেষ ***

    answerWrapper.appendChild(tempDiv);
    
    accordionBody.appendChild(answerWrapper);
    accordionHeader.onclick = () => handleAccordionClick(accordionHeader, accordionBody);

    accordionItem.append(accordionHeader, accordionBody);
    return accordionItem;
}

/**
 * একটি MCQ প্রশ্নের জন্য HTML এলিমেন্ট তৈরি করে।
 * Creates an HTML element for an MCQ question.
 */
function createMCQElement(item, index) {
    const card = document.createElement('div');
    card.className = 'card p-6 rounded-lg shadow-sm fade-in';
    card.style.animationDelay = `${index * 40}ms`;

    card.innerHTML = `<h4 class="mcq-question-title">${item.q}</h4>`;

    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-3';

    item.o.forEach((optionText, i) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'mcq-option p-3 rounded-md flex items-center gap-3';
        optionEl.innerHTML = `<span class="option-icon font-bold w-4"></span><span>${optionText}</span>`;
        optionEl.onclick = () => handleMCQOptionClick(optionEl, item, i);
        optionsGrid.appendChild(optionEl);
    });

    card.appendChild(optionsGrid);
    return card;
}

/**
 * একটি নোটের জন্য HTML এলিমেন্ট তৈরি করে।
 * Creates an HTML element for a note.
 */
function createNoteElement(note, index) {
    const accordionItem = document.createElement('div');
    accordionItem.className = 'card p-0 rounded-lg shadow-sm fade-in overflow-hidden';
    accordionItem.style.animationDelay = `${index * 40}ms`;

    const accordionHeader = document.createElement('button');
    accordionHeader.className = 'question-accordion-header';
    accordionHeader.innerHTML = `<span class="pr-4">${note.title}</span><span class="text-2xl font-light transition-transform duration-300 transform_plus">+</span>`;

    const accordionBody = document.createElement('div');
    accordionBody.className = 'question-accordion-body';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.content;
    tempDiv.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
    
    // *** নতুন সংশোধিত কোড শুরু ***
    // কন্টেন্টের ভেতরে থাকা টেবিলকে রেসপন্সিভ করার জন্য র‍্যাপার যুক্ত করা
    tempDiv.querySelectorAll('table').forEach(table => {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper'; // এই ক্লাসটি style.css এ ডিফাইন করা আছে
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
    // *** নতুন সংশোধিত কোড শেষ ***

    accordionBody.innerHTML = `<div class="prose max-w-none dark:prose-invert">${tempDiv.innerHTML}</div><p class="text-right text-sm italic mt-4 text-zinc-400">Date: ${note.date}</p>`;
    
    accordionHeader.onclick = () => handleAccordionClick(accordionHeader, accordionBody);

    accordionItem.append(accordionHeader, accordionBody);
    return accordionItem;
}