import React, { useState, useEffect } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { fetchUserProfile } from "../api/auth";
import { logEvent } from "../api/logging";
import { Draggable } from "./Draggable";
import { Droppable } from "./Droppable";

// --- CONSTANTS ---
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ROW_HEIGHT = 60;
const API_BASE_URL = "http://localhost:8080/api";

const COLORS = [
  { bg: "#e3f2fd", border: "#2196f3" }, // Blue
  { bg: "#ffecd1", border: "orange" },  // Orange
  { bg: "#e8f5e9", border: "#4caf50" }, // Green
  { bg: "#ffebee", border: "#e53935" }, // Red
  { bg: "#f3e5f5", border: "#9c27b0" }, // Purple
];

// --- HELPER FUNCTIONS ---

/**
 * Checks if a task overlaps with existing placements.
 * Returns true if a collision is detected.
 */
const checkOverlap = (targetDay, targetHour, itemDuration, currentItemId, placements, allItems) => {
  for (const [placedItemId, placedSlotId] of Object.entries(placements)) {
    if (placedItemId === currentItemId) continue; // Don't check against self

    const [placedDay, placedHourStr] = placedSlotId.split("-");
    const placedHour = parseFloat(placedHourStr);

    if (placedDay !== targetDay) continue; // Different day, no collision

    const placedItem = allItems.find((i) => i.id === placedItemId);
    const placedDuration = placedItem ? placedItem.duration : 1;

    // Standard AABB collision detection for 1D timeline
    if (targetHour < placedHour + placedDuration && placedHour < targetHour + itemDuration) {
      return true;
    }
  }
  return false;
};

// --- SUB-COMPONENTS ---

/**
 * Renders an individual task card.
 * Moved outside the main component to prevent unnecessary re-renders.
 */
const ItemComponent = ({ item, isOverlay, isInInbox, onClick, onEdit, onDelete }) => {
  const height = isInInbox && !isOverlay ? "auto" : `${item.duration * ROW_HEIGHT - 4}px`;
  const containerClass = isInInbox && !isOverlay ? "item-container inbox-item" : "item-container";

  return (
    <div
      className={containerClass}
      style={{
        background: item.color,
        borderLeft: `4px solid ${item.borderColor}`,
        borderRadius: "4px",
        height: height,
        zIndex: 20,
        position: "relative",
        boxSizing: "border-box",
        padding: isInInbox && !isOverlay ? "8px" : "5px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
        cursor: "grab",
        boxShadow: isOverlay ? "0 5px 15px rgba(0,0,0,0.3)" : "none", // Shadow when dragging
      }}
      onClick={onClick}
    >
      <div style={{ fontWeight: "bold", lineHeight: "1.2", fontSize: "0.9rem" }}>{item.name}</div>

      {item.location && (
        <div
          style={{
            fontSize: "0.75rem",
            opacity: 0.8,
            marginTop: "2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          📍 {item.location}
        </div>
      )}

      {/* Duration Badge */}
      <span
        className="duration-badge"
        style={{
          fontSize: "0.7rem",
          position: isInInbox && !isOverlay ? "static" : "absolute",
          top: "2px",
          right: "4px",
          marginLeft: isInInbox && !isOverlay ? "auto" : "0",
          marginTop: isInInbox && !isOverlay ? "5px" : "0",
          fontWeight: "bold",
          opacity: 0.6
        }}
      >
        {item.duration}h
      </span>

      {/* Action Buttons */}
      <div style={{ position: 'absolute', bottom: '2px', right: '2px', display: 'flex', gap: '2px' }}>
        <button 
            className="edit-btn" 
            title="Edit" 
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={(e) => onEdit(item, e)}
            style={{border:'none', background:'none', cursor:'pointer', fontSize:'0.8rem'}}
        >
          ✎
        </button>

        <button 
            className="delete-btn" 
            title="Delete" 
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={(e) => onDelete(item.id, e)}
            style={{border:'none', background:'none', cursor:'pointer', color:'#d32f2f', fontSize:'0.8rem'}}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

function WeekPlanner({ userData }) {
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState([]);
  const [placements, setPlacements] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [error, setError] = useState(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    duration: 1,
    colorIndex: 0,
    location: "",
  });

  /**
   * Syncs the current schedule state to the backend.
   */
  const savePlacementsToBackend = async (newPlacements) => {
    try {
      const token = localStorage.getItem("userToken");
      await fetch(`${API_BASE_URL}/auth/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ placements: newPlacements }),
      });
    } catch (err) {
      console.error("Failed to save schedule:", err);
    }
  };

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("userToken");
      try {
        const data = await fetchUserProfile(token);
        const prefs = data.initialPreferences || {};

        if (data.placements) {
          setPlacements(data.placements);
        }

        let generatedItems = [];

        // 1. Load Custom Tasks
        if (data.customTasks && data.customTasks.length > 0) {
          generatedItems = [...generatedItems, ...data.customTasks];
        }

        // 2. Generate Hobby Tasks
        if (prefs.hobbies) {
          prefs.hobbies.forEach((hobby, index) => {
            const freq = Number(hobby.frequency) || 1;
            const dur = Number(hobby.duration) || 1;
            for (let i = 0; i < freq; i++) {
              generatedItems.push({
                id: `hobby-${index}-${i}`,
                name: hobby.name,
                duration: dur,
                type: "HOBBY",
                color: "#e3f2fd",
                borderColor: "#2196f3",
                location: hobby.location || "",
              });
            }
          });
        }

        // 3. Generate Work Blocks
        let hoursLeft = prefs.workHours || 40;
        let workIndex = 0;
        while (hoursLeft > 0) {
          const blockDuration = hoursLeft >= 4 ? 4 : hoursLeft;
          generatedItems.push({
            id: `work-${workIndex}`,
            name: "Work",
            duration: blockDuration,
            type: "WORK",
            color: "#ffecd1",
            borderColor: "orange",
            location: prefs.location || "Office", // Inferred location
          });
          hoursLeft -= blockDuration;
          workIndex++;
        }
        setAllItems(generatedItems);
      } catch (err) {
        console.error("Error loading planner:", err);
        setError("Could not load your schedule.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- HANDLERS ---

  const openCreateModal = () => {
    setFormData({ name: "", duration: 1, colorIndex: 0, location: "" });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const color = COLORS[formData.colorIndex];
    const newItem = {
      id: `custom-${Date.now()}`,
      name: formData.name,
      duration: Number(formData.duration),
      type: "CUSTOM",
      color: color.bg,
      borderColor: color.border,
      location: formData.location || "",
    };

    setAllItems([newItem, ...allItems]);
    setShowCreateModal(false);

    try {
      const token = localStorage.getItem("userToken");
      await fetch(`${API_BASE_URL}/auth/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ task: newItem }),
      });

      logEvent("TASK_CREATED", {
        name: newItem.name,
        location: newItem.location,
        itemId: newItem.id,
      });
    } catch (err) {
      console.error("Failed to save task", err);
    }
  };

  const handleDelete = (itemId, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (!window.confirm("Delete this task?")) return;

    setAllItems(allItems.filter((i) => i.id !== itemId));
    const newPlacements = { ...placements };
    delete newPlacements[itemId];
    setPlacements(newPlacements);

    savePlacementsToBackend(newPlacements);
    logEvent("TASK_DELETED", { itemId });
  };

  const openEditModal = (item, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const cIndex = COLORS.findIndex((c) => c.bg === item.color);
    setFormData({
      name: item.name,
      duration: item.duration,
      colorIndex: cIndex !== -1 ? cIndex : 0,
      location: item.location || "",
    });
    setEditingItem(item);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const color = COLORS[formData.colorIndex];
    const updatedItem = {
      ...editingItem,
      name: formData.name,
      duration: Number(formData.duration),
      color: color.bg,
      borderColor: color.border,
      location: formData.location,
    };
    setAllItems(allItems.map((i) => (i.id === editingItem.id ? updatedItem : i)));
    setEditingItem(null);
    logEvent("TASK_EDITED", { itemId: editingItem.id, location: updatedItem.location });
  };

  // --- DND HANDLERS ---

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const itemId = active.id;
    const targetId = over.id;
    const item = allItems.find((i) => i.id === itemId);

    // Scenario 1: Drag to Inbox (Remove from schedule)
    if (targetId === "inbox") {
      const newPlacements = { ...placements };
      delete newPlacements[itemId];
      setPlacements(newPlacements);
      savePlacementsToBackend(newPlacements);
      logEvent("TASK_MOVED", { itemId, target: "inbox" });
    } 
    // Scenario 2: Drag to Schedule Slot
    else {
      const [targetDay, targetHourStr] = targetId.split("-");
      const targetHour = parseInt(targetHourStr);
      const hasOverlap = checkOverlap(targetDay, targetHour, item.duration, itemId, placements, allItems);

      if (hasOverlap) {
        // Optional: Show visual feedback that overlap occurred
        return;
      }

      const newPlacements = { ...placements, [itemId]: targetId };
      setPlacements(newPlacements);
      savePlacementsToBackend(newPlacements);
      
      // Surveillance: Log where the user plans to be
      logEvent("TASK_SCHEDULED", {
        itemId,
        day: targetDay,
        hour: targetHour,
        name: item.name,
        location: item.location, // Location tracking 📍
      });
    }
  };

  // --- HELPERS FOR RENDER ---
  const inboxItems = allItems.filter((item) => !placements[item.id]);
  
  const getItemForSlot = (slotId) => {
    // Find key in placements object where value matches slotId
    const itemId = Object.keys(placements).find((key) => placements[key] === slotId);
    return itemId ? allItems.find((i) => i.id === itemId) : null;
  };

  if (loading) return <div className="page-container">Loading planner...</div>;

  // --- MODAL COMPONENT (Internal) ---
  const renderModalForm = (onSubmit, title, cancelAction) => (
    <div className="modal-overlay" style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="modal-content" style={{background: 'white', padding: '20px', borderRadius: '8px', width: '300px'}}>
        <h3>{title}</h3>
        <form onSubmit={onSubmit} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
          <label>Name</label>
          <input type="text" value={formData.name} required onChange={(e) => setFormData({ ...formData, name: e.target.value })} />

          <label>Location (Optional)</label>
          <input type="text" placeholder="Where? (e.g. Office, Gym)" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />

          <label>Duration (hours)</label>
          <input type="number" min="0.5" max="8" step="0.5" value={formData.duration} required onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />

          <label>Color</label>
          <div className="color-options" style={{display: 'flex', gap: '5px'}}>
            {COLORS.map((c, i) => (
              <div 
                key={i} 
                style={{ 
                    width: '24px', height: '24px', background: c.bg, border: `2px solid ${formData.colorIndex === i ? '#333' : c.border}`, 
                    borderRadius: '50%', cursor: 'pointer' 
                }} 
                onClick={() => setFormData({ ...formData, colorIndex: i })} 
              />
            ))}
          </div>
          <div className="modal-actions" style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
            <button type="button" className="btn-secondary" onClick={cancelAction} style={{flex: 1}}>Cancel</button>
            <button type="submit" className="btn-primary" style={{flex: 1}}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        className="planner-wrapper"
        style={{
          display: "flex",
          gap: "20px",
          height: "calc(100vh - 120px)",
          flexDirection: "row", // Ensure side-by-side layout
        }}
      >
        {error && <div style={{ background: "#ffebee", color: "#c62828", padding: "10px", textAlign: "center", fontWeight: "bold", position: 'absolute', top: 0, width: '100%' }}>{error}</div>}

        {/* --- MAIN CALENDAR GRID --- */}
        <div className="planner-main" style={{ flex: 3, display: "flex", flexDirection: "column", overflowY: "auto", border: '1px solid #eee', borderRadius: '8px' }}>
          <div className="schedule-header" style={{display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid #ddd', background: '#f9f9f9', position: 'sticky', top: 0, zIndex: 10}}>
            <div className="header-cell" style={{padding: '10px', fontWeight: 'bold'}}>Time</div>
            {DAYS.map((day) => (
              <div key={day} className="header-cell" style={{padding: '10px', fontWeight: 'bold', textAlign: 'center', borderLeft: '1px solid #eee'}}>
                {day}
              </div>
            ))}
          </div>

          <div className="schedule-grid" style={{display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)'}}>
            {HOURS.map((hour) => (
              <React.Fragment key={hour}>
                <div className="time-label" style={{padding: '5px', textAlign: 'right', color: '#888', borderBottom: '1px solid #eee', height: `${ROW_HEIGHT}px`, boxSizing: 'border-box'}}>{hour}:00</div>
                {DAYS.map((day) => {
                  const slotId = `${day}-${hour}`;
                  const itemInSlot = getItemForSlot(slotId);
                  return (
                    <Droppable key={slotId} id={slotId}>
                      <div className="time-slot" style={{borderLeft: '1px solid #eee', borderBottom: '1px solid #eee', height: `${ROW_HEIGHT}px`, position: 'relative', boxSizing: 'border-box'}}>
                        {itemInSlot && (
                          <Draggable id={itemInSlot.id} data={itemInSlot}>
                            <ItemComponent 
                                item={itemInSlot} 
                                isOverlay={false} 
                                isInInbox={false} 
                                onClick={() => openEditModal(itemInSlot)} 
                                onEdit={openEditModal}
                                onDelete={handleDelete}
                            />
                          </Draggable>
                        )}
                      </div>
                    </Droppable>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* --- SIDEBAR (INBOX) --- */}
        <div className="planner-sidebar" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", minWidth: '250px' }}>
          <Droppable id="inbox">
            <div
              style={{
                background: "white",
                padding: "20px",
                height: "100%",
                overflowY: "auto",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                border: '1px solid #eee'
              }}
            >
              <div className="sidebar-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <h3 style={{margin: 0}}>
                  Inbox <span style={{ fontSize: "0.8em", color: "#999", fontWeight: "normal" }}>({inboxItems.length})</span>
                </h3>
                <button 
                    className="add-btn-small" 
                    onClick={openCreateModal} 
                    title="Create Task"
                    style={{background: '#4CAF50', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem'}}
                >
                  +
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                {inboxItems.map((item) => (
                  <Draggable key={item.id} id={item.id} data={item}>
                    <ItemComponent 
                        item={item} 
                        isOverlay={false} 
                        isInInbox={true} 
                        onClick={() => openEditModal(item)} 
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                    />
                  </Draggable>
                ))}

                {inboxItems.length === 0 && (
                  <div style={{ marginTop: "20px", textAlign: "center", color: "#aaa", border: "2px dashed #eee", padding: "20px", borderRadius: "8px" }}>
                    Inbox empty.
                    <br />
                    <small>Create a task or drag from schedule.</small>
                  </div>
                )}
              </div>
            </div>
          </Droppable>
        </div>
      </div>

      {showCreateModal && renderModalForm(handleCreateSubmit, "New Task", () => setShowCreateModal(false))}
      {editingItem && renderModalForm(handleEditSubmit, "Edit Task", () => setEditingItem(null))}

      <DragOverlay>
        {activeId ? (
          <div style={{ width: "140px", opacity: 0.9 }}>
            <ItemComponent item={allItems.find((i) => i.id === activeId)} isOverlay={true} isInInbox={false} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default WeekPlanner;