# User Role Extension for Strapi

This extension adds custom role functionality to Strapi's users-permissions plugin, enabling a two-step authentication flow for a mentoring platform.

## Features

- **Custom Role Field**: Extends the user model with a `customRole` enum field (mentor, mentee, or null)
- **Role Selection API**: Custom endpoint `/api/auth/select-role` for users to choose their role
- **Role Guard Middleware**: Ensures users select a role before accessing protected resources
- **Role-specific Access Control**: Middleware for role-based permissions
- **User Profile Endpoint**: Enhanced `/api/auth/me` endpoint with role information

## API Endpoints

### POST `/api/auth/select-role`

Allows authenticated users to select their role after registration.

**Request Body:**

```json
{
  "role": "mentor" // or "mentee"
}
```

**Response:**

```json
{
  "jwt": "new-jwt-token",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "customRole": "mentor"
    // ... other user fields
  },
  "message": "Role \"mentor\" selected successfully"
}
```

**Error Responses:**

- `400`: Invalid role or user already has a role
- `401`: Not authenticated
- `404`: User not found

### GET `/api/auth/me`

Enhanced user profile endpoint that includes role information.

**Response:**

```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "customRole": "mentor"
    // ... other user fields
  }
}
```

## Implementation Flow

### 1. User Registration

```javascript
// Standard Strapi registration
const response = await fetch("/api/auth/local/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "johndoe",
    email: "john@example.com",
    password: "password123",
  }),
});

const { jwt, user } = await response.json();
// user.customRole will be null at this point
```

### 2. Role Selection

```javascript
// After registration, redirect user to role selection page
const roleResponse = await fetch("/api/auth/select-role", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwt}`,
  },
  body: JSON.stringify({
    role: "mentor", // or 'mentee'
  }),
});

const { jwt: newJwt, user: updatedUser } = await roleResponse.json();
// updatedUser.customRole will now be 'mentor' or 'mentee'
```

### 3. Dashboard Redirect

```javascript
// Frontend logic to redirect based on role
if (user.customRole === "mentor") {
  // Redirect to mentor dashboard
  window.location.href = "/mentor-dashboard";
} else if (user.customRole === "mentee") {
  // Redirect to mentee dashboard
  window.location.href = "/mentee-dashboard";
} else {
  // Redirect to role selection page
  window.location.href = "/select-role";
}
```

## Middleware Usage

### Role Guard Middleware

Ensures users have selected a role before accessing protected resources:

```javascript
// In your route configuration
{
  method: 'GET',
  path: '/protected-endpoint',
  handler: 'controller.method',
  config: {
    middlewares: ['plugin::users-permissions.roleGuard'],
  },
}
```

### Role-Specific Middleware

Restricts access to users with specific roles:

```javascript
// For mentor-only endpoints
{
  method: 'GET',
  path: '/mentor-only-endpoint',
  handler: 'controller.method',
  config: {
    middlewares: [
      (ctx, next) => require('./middlewares/role-guard').requireRole('mentor')(ctx, next)
    ],
  },
}
```

## Services

### User Role Service

Provides utility methods for role management:

```javascript
// Check if user can select a role
const canSelect = await strapi
  .service("plugin::users-permissions.user-role")
  .canSelectRole(userId);

// Get users by role
const mentors = await strapi
  .service("plugin::users-permissions.user-role")
  .getUsersByRole("mentor");

// Get role statistics
const stats = await strapi
  .service("plugin::users-permissions.user-role")
  .getRoleStats();
```

## Frontend Integration Examples

### React Hook for Role Management

```javascript
import { useState, useEffect } from "react";

export const useUserRole = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("jwt");
        if (!token) return;

        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const selectRole = async (role) => {
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch("/api/auth/select-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("jwt", data.jwt);
        setUser(data.user);
        return data.user;
      } else {
        throw new Error("Failed to select role");
      }
    } catch (error) {
      console.error("Error selecting role:", error);
      throw error;
    }
  };

  return { user, loading, selectRole };
};
```

### Role Selection Component

```javascript
import React, { useState } from "react";
import { useUserRole } from "./hooks/useUserRole";

export const RoleSelection = ({ onRoleSelected }) => {
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const { selectRole } = useUserRole();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) return;

    setLoading(true);
    try {
      const updatedUser = await selectRole(selectedRole);
      onRoleSelected(updatedUser);
    } catch (error) {
      console.error("Error selecting role:", error);
      alert("Failed to select role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-selection">
      <h2>Choose Your Role</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            <input
              type="radio"
              value="mentor"
              checked={selectedRole === "mentor"}
              onChange={(e) => setSelectedRole(e.target.value)}
            />
            Mentor - Share your expertise and guide others
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              value="mentee"
              checked={selectedRole === "mentee"}
              onChange={(e) => setSelectedRole(e.target.value)}
            />
            Mentee - Learn from experienced professionals
          </label>
        </div>
        <button type="submit" disabled={!selectedRole || loading}>
          {loading ? "Selecting..." : "Continue"}
        </button>
      </form>
    </div>
  );
};
```

## Error Handling

The extension provides comprehensive error handling with specific error codes:

- `ROLE_SELECTION_REQUIRED`: User needs to select a role
- `INSUFFICIENT_ROLE`: User doesn't have the required role for the endpoint

Frontend applications can handle these errors to provide appropriate user experience:

```javascript
fetch("/api/protected-endpoint", {
  headers: { Authorization: `Bearer ${token}` },
})
  .then((response) => {
    if (!response.ok) {
      return response.json().then((error) => {
        if (error.details?.code === "ROLE_SELECTION_REQUIRED") {
          // Redirect to role selection
          window.location.href = "/select-role";
        } else if (error.details?.code === "INSUFFICIENT_ROLE") {
          // Show access denied message
          alert(`Access denied. Required role: ${error.details.requiredRole}`);
        }
        throw error;
      });
    }
    return response.json();
  })
  .then((data) => {
    // Handle successful response
  })
  .catch((error) => {
    console.error("API Error:", error);
  });
```

## Permissions Setup

1. **Enable Authentication**: Ensure the users-permissions plugin is enabled
2. **Role Permissions**: Configure permissions for different user roles in the Strapi admin panel
3. **API Permissions**: Set appropriate permissions for your custom endpoints

## Best Practices

1. **JWT Token Management**: Always update the JWT token after role selection
2. **Frontend State Management**: Keep user role state synchronized across your application
3. **Error Boundaries**: Implement proper error handling for role-related errors
4. **Progressive Enhancement**: Gracefully handle cases where users haven't selected roles yet
5. **Security**: Never trust client-side role information; always validate on the server

## Database Considerations

The `customRole` field is added to the existing `up_users` table. No migration is needed as it's nullable by default. Existing users will have `customRole: null` until they select a role.

## Testing

Test the implementation with different scenarios:

1. New user registration → role selection → dashboard access
2. Existing users without roles → forced role selection
3. Role-specific endpoint access
4. Error handling for invalid roles
5. JWT token refresh after role selection
