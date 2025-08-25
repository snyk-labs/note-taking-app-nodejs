class NoteApp {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user'));
        this.notes = [];
        this.currentNoteId = null;
        
        this.initializeEventListeners();
        this.checkAuthStatus();
    }

    initializeEventListeners() {
        // Auth form switches
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Auth forms
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Note forms
        document.getElementById('createNoteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateNote();
        });

        document.getElementById('editNoteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUpdateNote();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Delete note button
        document.getElementById('deleteNoteBtn').addEventListener('click', () => {
            this.handleDeleteNote();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    checkAuthStatus() {
        if (this.token && this.user) {
            this.showNotesSection();
            this.loadNotes();
        } else {
            this.showAuthForms();
        }
    }

    showAuthForms() {
        document.getElementById('authForms').style.display = 'flex';
        document.getElementById('notesSection').style.display = 'none';
        document.getElementById('userInfo').style.display = 'none';
    }

    showNotesSection() {
        document.getElementById('authForms').style.display = 'none';
        document.getElementById('notesSection').style.display = 'block';
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('username').textContent = this.user.username;
    }

    showLoginForm() {
        document.querySelector('.form-container').style.display = 'none';
        document.querySelector('.form-container:last-of-type').style.display = 'block';
    }

    showRegisterForm() {
        document.querySelector('.form-container').style.display = 'block';
        document.querySelector('.form-container:last-of-type').style.display = 'none';
    }

    async handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            this.showLoading(true);
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                this.showMessage('Login successful!', 'success');
                this.showNotesSection();
                this.loadNotes();
                
                // Clear form
                document.getElementById('loginForm').reset();
            } else {
                this.showMessage(data.error, 'error');
            }
        } catch (error) {
            this.showMessage('An error occurred during login', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            this.showLoading(true);
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                this.showMessage('Registration successful!', 'success');
                this.showNotesSection();
                this.loadNotes();
                
                // Clear form
                document.getElementById('registerForm').reset();
            } else {
                this.showMessage(data.error, 'error');
            }
        } catch (error) {
            this.showMessage('An error occurred during registration', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    handleLogout() {
        this.token = null;
        this.user = null;
        this.notes = [];
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        this.showAuthForms();
        this.showMessage('Logged out successfully', 'success');
    }

    async loadNotes() {
        try {
            this.showLoading(true);
            const response = await fetch('/api/notes', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                this.notes = data.notes;
                this.renderNotes();
            } else {
                this.showMessage('Failed to load notes', 'error');
            }
        } catch (error) {
            this.showMessage('An error occurred while loading notes', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderNotes() {
        const container = document.getElementById('notesContainer');
        container.innerHTML = '';

        if (this.notes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1 / -1;">No notes yet. Create your first note above!</p>';
            return;
        }

        this.notes.forEach(note => {
            const noteCard = document.createElement('div');
            noteCard.className = 'note-card';
            noteCard.innerHTML = `
                <h4>${this.escapeHtml(note.title)}</h4>
                <p>${this.escapeHtml(note.content || 'No content')}</p>
                <div class="note-meta">
                    <span>Created: ${new Date(note.created_at).toLocaleDateString()}</span>
                    <span>Updated: ${new Date(note.updated_at).toLocaleDateString()}</span>
                </div>
            `;
            
            noteCard.addEventListener('click', () => {
                this.openEditModal(note);
            });
            
            container.appendChild(noteCard);
        });
    }

    async handleCreateNote() {
        const title = document.getElementById('noteTitle').value;
        const content = document.getElementById('noteContent').value;

        try {
            this.showLoading(true);
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                },
                body: JSON.stringify({ title, content }),
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Note created successfully!', 'success');
                document.getElementById('createNoteForm').reset();
                this.loadNotes();
            } else {
                this.showMessage(data.error, 'error');
            }
        } catch (error) {
            this.showMessage('An error occurred while creating the note', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    openEditModal(note) {
        this.currentNoteId = note.id;
        document.getElementById('editNoteId').value = note.id;
        document.getElementById('editNoteTitle').value = note.title;
        document.getElementById('editNoteContent').value = note.content || '';
        document.getElementById('noteModal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('noteModal').style.display = 'none';
        this.currentNoteId = null;
        document.getElementById('editNoteForm').reset();
    }

    async handleUpdateNote() {
        const title = document.getElementById('editNoteTitle').value;
        const content = document.getElementById('editNoteContent').value;

        try {
            this.showLoading(true);
            const response = await fetch(`/api/notes/${this.currentNoteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                },
                body: JSON.stringify({ title, content }),
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Note updated successfully!', 'success');
                this.closeModal();
                this.loadNotes();
            } else {
                this.showMessage(data.error, 'error');
            }
        } catch (error) {
            this.showMessage('An error occurred while updating the note', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleDeleteNote() {
        if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            return;
        }

        try {
            this.showLoading(true);
            const response = await fetch(`/api/notes/${this.currentNoteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Note deleted successfully!', 'success');
                this.closeModal();
                this.loadNotes();
            } else {
                this.showMessage(data.error, 'error');
            }
        } catch (error) {
            this.showMessage('An error occurred while deleting the note', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }

    showMessage(message, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';

        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NoteApp();
});
