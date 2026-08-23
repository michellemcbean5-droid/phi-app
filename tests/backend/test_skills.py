"""
Test suite for Skill Management API endpoints.
Tests the CRUD operations for skill domains, skills, and user skills.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from backend.main import app, get_db
from backend.app.database import Base, SkillDomain, Skill, UserSkill, User, _uuid, _now

# Test database setup
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module")
def test_db():
    """Create test database and tables."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(test_db):
    """Create a fresh database session for each test."""
    session = TestingSessionLocal()
    try:
        yield session
        session.rollback()
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Create test client with database dependency override."""
    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def sample_domain(db_session):
    """Create a sample skill domain for testing."""
    domain = SkillDomain(
        id=_uuid(),
        name="Test Domain",
        description="A test domain for skill management",
        display_order=1,
        is_active=True,
        created_at=_now(),
        updated_at=_now()
    )
    db_session.add(domain)
    db_session.commit()
    db_session.refresh(domain)
    return domain


@pytest.fixture(scope="function")
def sample_skill(sample_domain, db_session):
    """Create a sample skill for testing."""
    skill = Skill(
        id=_uuid(),
        domain_id=sample_domain.id,
        name="Test Skill",
        description="A test skill",
        display_order=1,
        skill_number=1,
        is_active=True,
        tags=["test", "sample"],
        created_at=_now(),
        updated_at=_now()
    )
    db_session.add(skill)
    db_session.commit()
    db_session.refresh(skill)
    return skill


@pytest.fixture(scope="function")
def sample_user(db_session):
    """Create a sample user for testing."""
    user = User(
        id=_uuid(),
        email="test@example.com",
        full_name="Test User",
        role="driver",
        subscription_tier="Solo",
        created_at=_now(),
        updated_at=_now()
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


# ==================== Skill Domain Tests ====================

class TestSkillDomains:
    """Tests for skill domain endpoints."""
    
    def test_list_skill_domains_empty(self, client):
        """Test listing skill domains when none exist."""
        response = client.get("/api/v1/skill-domains")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_list_skill_domains_with_data(self, client, sample_domain):
        """Test listing skill domains with existing data."""
        response = client.get("/api/v1/skill-domains")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        
        domain = next((d for d in data if d["name"] == "Test Domain"), None)
        assert domain is not None
        assert domain["name"] == "Test Domain"
        assert domain["description"] == "A test domain for skill management"
        assert domain["is_active"] is True
    
    def test_list_skill_domains_include_inactive(self, client, db_session):
        """Test listing skill domains including inactive ones."""
        # Create an inactive domain
        inactive_domain = SkillDomain(
            id=_uuid(),
            name="Inactive Domain",
            description="An inactive test domain",
            display_order=2,
            is_active=False,
            created_at=_now(),
            updated_at=_now()
        )
        db_session.add(inactive_domain)
        db_session.commit()
        
        # Default should not include inactive
        response = client.get("/api/v1/skill-domains")
        assert response.status_code == 200
        data = response.json()
        inactive_found = any(d["name"] == "Inactive Domain" for d in data)
        assert inactive_found is False
        
        # Include inactive
        response = client.get("/api/v1/skill-domains?include_inactive=true")
        assert response.status_code == 200
        data = response.json()
        inactive_found = any(d["name"] == "Inactive Domain" for d in data)
        assert inactive_found is True
    
    def test_get_skill_domain(self, client, sample_domain):
        """Test getting a specific skill domain by ID."""
        response = client.get(f"/api/v1/skill-domains/{sample_domain.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_domain.id
        assert data["name"] == "Test Domain"
    
    def test_get_skill_domain_not_found(self, client):
        """Test getting a non-existent skill domain."""
        response = client.get("/api/v1/skill-domains/non-existent-id")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


# ==================== Skill Tests ====================

class TestSkills:
    """Tests for skill endpoints."""
    
    def test_list_skills_empty(self, client):
        """Test listing skills when none exist."""
        response = client.get("/api/v1/skills")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_list_skills_with_data(self, client, sample_skill):
        """Test listing skills with existing data."""
        response = client.get("/api/v1/skills")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        
        skill = next((s for s in data if s["name"] == "Test Skill"), None)
        assert skill is not None
        assert skill["name"] == "Test Skill"
        assert skill["skill_number"] == 1
        assert skill["tags"] == ["test", "sample"]
    
    def test_list_skills_filter_by_domain(self, client, sample_domain, sample_skill, db_session):
        """Test filtering skills by domain ID."""
        # Create another skill in a different domain
        other_domain = SkillDomain(
            id=_uuid(),
            name="Other Domain",
            description="Another test domain",
            display_order=2,
            is_active=True,
            created_at=_now(),
            updated_at=_now()
        )
        db_session.add(other_domain)
        db_session.commit()
        
        other_skill = Skill(
            id=_uuid(),
            domain_id=other_domain.id,
            name="Other Skill",
            description="Another test skill",
            display_order=1,
            skill_number=2,
            is_active=True,
            tags=["other"],
            created_at=_now(),
            updated_at=_now()
        )
        db_session.add(other_skill)
        db_session.commit()
        
        # Filter by domain
        response = client.get(f"/api/v1/skills?domain_id={sample_domain.id}")
        assert response.status_code == 200
        data = response.json()
        
        # Should only return skills from the specified domain
        assert all(s["domain_id"] == sample_domain.id for s in data)
        assert len(data) >= 1
    
    def test_list_skills_filter_by_number(self, client, sample_skill):
        """Test filtering skills by skill number."""
        response = client.get("/api/v1/skills?skill_number=1")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert all(s["skill_number"] == 1 for s in data)
    
    def test_list_skills_search(self, client, sample_skill):
        """Test searching skills by name or description."""
        response = client.get("/api/v1/skills?search=Test")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any("Test" in s["name"] for s in data)
    
    def test_get_skill(self, client, sample_skill):
        """Test getting a specific skill by ID."""
        response = client.get(f"/api/v1/skills/{sample_skill.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_skill.id
        assert data["name"] == "Test Skill"
    
    def test_get_skill_not_found(self, client):
        """Test getting a non-existent skill."""
        response = client.get("/api/v1/skills/non-existent-id")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


# ==================== User Skill Tests ====================

class TestUserSkills:
    """Tests for user skill endpoints."""
    
    def test_list_user_skills_empty(self, client, sample_user):
        """Test listing user skills when none exist."""
        response = client.get(f"/api/v1/users/{sample_user.id}/skills")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_create_user_skill(self, client, sample_user, sample_skill):
        """Test creating a user skill association."""
        payload = {
            "skill_id": sample_skill.id,
            "proficiency_level": "intermediate",
            "years_experience": 2.5,
            "verified": True,
            "verification_notes": "Verified through testing"
        }
        
        response = client.post(
            f"/api/v1/users/{sample_user.id}/skills",
            json=payload
        )
        assert response.status_code == 201
        data = response.json()
        assert data["user_id"] == sample_user.id
        assert data["skill_id"] == sample_skill.id
        assert data["proficiency_level"] == "intermediate"
        assert data["years_experience"] == 2.5
        assert data["verified"] is True
    
    def test_create_user_skill_duplicate(self, client, sample_user, sample_skill, db_session):
        """Test creating a duplicate user skill association."""
        # First create the skill association
        user_skill = UserSkill(
            id=_uuid(),
            user_id=sample_user.id,
            skill_id=sample_skill.id,
            proficiency_level="beginner",
            years_experience=1.0,
            verified=False,
            created_at=_now(),
            updated_at=_now()
        )
        db_session.add(user_skill)
        db_session.commit()
        
        # Try to create again
        payload = {
            "skill_id": sample_skill.id,
            "proficiency_level": "intermediate"
        }
        
        response = client.post(
            f"/api/v1/users/{sample_user.id}/skills",
            json=payload
        )
        assert response.status_code == 409
        assert "already has" in response.json()["detail"].lower()
    
    def test_create_user_skill_invalid_user(self, client, sample_skill):
        """Test creating a user skill with invalid user ID."""
        payload = {
            "skill_id": sample_skill.id,
            "proficiency_level": "intermediate"
        }
        
        response = client.post(
            "/api/v1/users/non-existent-user/skills",
            json=payload
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_create_user_skill_invalid_skill(self, client, sample_user):
        """Test creating a user skill with invalid skill ID."""
        payload = {
            "skill_id": "non-existent-skill",
            "proficiency_level": "intermediate"
        }
        
        response = client.post(
            f"/api/v1/users/{sample_user.id}/skills",
            json=payload
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_list_user_skills_with_data(self, client, sample_user, sample_skill, db_session):
        """Test listing user skills with existing data."""
        # Create a user skill association
        user_skill = UserSkill(
            id=_uuid(),
            user_id=sample_user.id,
            skill_id=sample_skill.id,
            proficiency_level="expert",
            years_experience=5.0,
            verified=True,
            verification_notes="Highly skilled",
            created_at=_now(),
            updated_at=_now()
        )
        db_session.add(user_skill)
        db_session.commit()
        
        response = client.get(f"/api/v1/users/{sample_user.id}/skills")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        
        skill = next((s for s in data if s["skill_id"] == sample_skill.id), None)
        assert skill is not None
        assert skill["skill_name"] == "Test Skill"
        assert skill["proficiency_level"] == "expert"
    
    def test_update_user_skill(self, client, sample_user, sample_skill, db_session):
        """Test updating a user skill."""
        # First create the user skill
        user_skill = UserSkill(
            id=_uuid(),
            user_id=sample_user.id,
            skill_id=sample_skill.id,
            proficiency_level="beginner",
            years_experience=0.5,
            verified=False,
            created_at=_now(),
            updated_at=_now()
        )
        db_session.add(user_skill)
        db_session.commit()
        
        # Update the skill
        payload = {
            "proficiency_level": "advanced",
            "years_experience": 3.0,
            "verified": True,
            "verification_notes": "Promoted after training"
        }
        
        response = client.patch(
            f"/api/v1/users/{sample_user.id}/skills/{sample_skill.id}",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["proficiency_level"] == "advanced"
        assert data["years_experience"] == 3.0
        assert data["verified"] is True
    
    def test_update_user_skill_not_found(self, client, sample_user):
        """Test updating a non-existent user skill."""
        payload = {
            "proficiency_level": "advanced"
        }
        
        response = client.patch(
            f"/api/v1/users/{sample_user.id}/skills/non-existent-skill",
            json=payload
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_delete_user_skill(self, client, sample_user, sample_skill, db_session):
        """Test deleting a user skill association."""
        # First create the user skill
        user_skill = UserSkill(
            id=_uuid(),
            user_id=sample_user.id,
            skill_id=sample_skill.id,
            proficiency_level="beginner",
            years_experience=0.5,
            verified=False,
            created_at=_now(),
            updated_at=_now()
        )
        db_session.add(user_skill)
        db_session.commit()
        
        # Delete the skill
        response = client.delete(
            f"/api/v1/users/{sample_user.id}/skills/{sample_skill.id}"
        )
        assert response.status_code == 204
        
        # Verify it's deleted
        response = client.get(f"/api/v1/users/{sample_user.id}/skills")
        assert response.status_code == 200
        data = response.json()
        assert not any(s["skill_id"] == sample_skill.id for s in data)
    
    def test_delete_user_skill_not_found(self, client, sample_user):
        """Test deleting a non-existent user skill."""
        response = client.delete(
            f"/api/v1/users/{sample_user.id}/skills/non-existent-skill"
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


# ==================== Integration Tests ====================

class TestSkillIntegration:
    """Integration tests for skill management."""
    
    def test_full_skill_lifecycle(self, client, db_session):
        """Test the full lifecycle of creating and managing skills."""
        # Create a domain
        domain_data = {
            "name": "Integration Test Domain",
            "description": "Domain for integration testing",
            "display_order": 1,
            "is_active": True
        }
        
        # Note: We're creating the domain directly in DB for now
        # In a full implementation, we'd have a POST endpoint for domains
        domain = SkillDomain(
            id=_uuid(),
            **domain_data,
            created_at=_now(),
            updated_at=_now()
        )
        db_session.add(domain)
        db_session.commit()
        
        # Create a skill in the domain
        skill_data = {
            "domain_id": domain.id,
            "name": "Integration Test Skill",
            "description": "Skill for integration testing",
            "display_order": 1,
            "skill_number": 999,
            "is_active": True,
            "tags": ["integration", "test"]
        }
        skill = Skill(
            id=_uuid(),
            **skill_data,
            created_at=_now(),
            updated_at=_now()
        )
        db_session.add(skill)
        db_session.commit()
        
        # Create a user
        user = User(
            id=_uuid(),
            email="integration@test.com",
            full_name="Integration User",
            role="driver",
            subscription_tier="Solo",
            created_at=_now(),
            updated_at=_now()
        )
        db_session.add(user)
        db_session.commit()
        
        # List domains
        response = client.get("/api/v1/skill-domains")
        assert response.status_code == 200
        domains = response.json()
        assert any(d["name"] == "Integration Test Domain" for d in domains)
        
        # List skills
        response = client.get("/api/v1/skills")
        assert response.status_code == 200
        skills = response.json()
        assert any(s["name"] == "Integration Test Skill" for s in skills)
        
        # Add skill to user
        payload = {
            "skill_id": skill.id,
            "proficiency_level": "expert",
            "years_experience": 10.0,
            "verified": True,
            "verification_notes": "Integration test verification"
        }
        response = client.post(
            f"/api/v1/users/{user.id}/skills",
            json=payload
        )
        assert response.status_code == 201
        
        # List user skills
        response = client.get(f"/api/v1/users/{user.id}/skills")
        assert response.status_code == 200
        user_skills = response.json()
        assert len(user_skills) == 1
        assert user_skills[0]["skill_name"] == "Integration Test Skill"
        assert user_skills[0]["proficiency_level"] == "expert"
        
        # Update user skill
        update_payload = {
            "proficiency_level": "advanced",
            "years_experience": 8.0
        }
        response = client.patch(
            f"/api/v1/users/{user.id}/skills/{skill.id}",
            json=update_payload
        )
        assert response.status_code == 200
        
        # Verify update
        response = client.get(f"/api/v1/users/{user.id}/skills")
        user_skills = response.json()
        assert user_skills[0]["proficiency_level"] == "advanced"
        assert user_skills[0]["years_experience"] == 8.0
        
        # Delete user skill
        response = client.delete(
            f"/api/v1/users/{user.id}/skills/{skill.id}"
        )
        assert response.status_code == 204
        
        # Verify deletion
        response = client.get(f"/api/v1/users/{user.id}/skills")
        assert response.json() == []
