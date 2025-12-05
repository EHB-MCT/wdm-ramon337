import React, { useState, useEffect } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { fetchUserProfile } from "../api/auth";
import { logEvent } from "../api/logging";
import { Draggable } from "./Draggable";
import { Droppable } from "./Droppable";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ROW_HEIGHT = 60;
const COLORS = [
  { bg: "#e3f2fd", border: "#2196f3" }, // Blauw
  { bg: "#ffecd1", border: "orange" }, // Oranje
  { bg: "#e8f5e9", border: "#4caf50" }, // Groen
  { bg: "#ffebee", border: "#e53935" }, // Rood
  { bg: "#f3e5f5", border: "#9c27b0" }, // Paars
];

// Helper voor overlap
const checkOverlap = (targetDay, targetHour, itemDuration, currentItemId, placements, allItems) => {
  for (const [placedItemId, placedSlotId] of Object.entries(placements)) {
    if (placedItemId === currentItemId) continue;
    const [placedDay, placedHourStr] = placedSlotId.split("-");
    const placedHour = parseFloat(placedHourStr);
    if (placedDay !== targetDay) continue;
    const placedItem = allItems.find((i) => i.id === placedItemId);
    const placedDuration = placedItem ? placedItem.duration : 1;
    if (targetHour < placedHour + placedDuration && placedHour < targetHour + itemDuration) {
      return true;
    }
  }
  return false;
};

function WeekPlanner() {
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState([]);
  const [placements, setPlacements] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [error, setError] = useState(null);

  // MODAL STATES
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", duration: 1, colorIndex: 0 });

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("userToken");
      try {
        const data = await fetchUserProfile(token);
        const prefs = data.initialPreferences;
        let generatedItems = [];

        // Hobbies
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
              });
            }
          });
        }

        // Work blocks
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
          });
          hoursLeft -= blockDuration;
          workIndex++;
        }
        setAllItems(generatedItems);
      } catch (err) {
        console.error("Error loading planner:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- CRUD HANDLERS ---

  const openCreateModal = () => {
    setFormData({ name: "", duration: 1, colorIndex: 0 });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e) => {
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
    };

    // NIEUW: Zet nieuwe items VOORAAN de lijst (bovenaan in inbox)
    setAllItems([newItem, ...allItems]);

    logEvent("TASK_CREATED", { name: newItem.name });
    setShowCreateModal(false);
  };

  const handleDelete = (itemId, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm("Delete this task?")) return;

    setAllItems(allItems.filter((i) => i.id !== itemId));
    const newPlacements = { ...placements };
    delete newPlacements[itemId];
    setPlacements(newPlacements);
    logEvent("TASK_DELETED", { itemId });
  };

  // OPEN EDIT MODAL
  const openEditModal = (item, e) => {
    // CRUCIAAL: Stop event propagation zodat we niet gaan slepen
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const cIndex = COLORS.findIndex((c) => c.bg === item.color);
    setFormData({
      name: item.name,
      duration: item.duration,
      colorIndex: cIndex !== -1 ? cIndex : 0,
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
    };

    setAllItems(allItems.map((i) => (i.id === editingItem.id ? updatedItem : i)));
    setEditingItem(null);
    logEvent("TASK_EDITED", { itemId: editingItem.id });
  };

  // --- DRAG HANDLERS ---
  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const itemId = active.id;
    const targetId = over.id;
    const item = allItems.find((i) => i.id === itemId);

    if (targetId === "inbox") {
      const newPlacements = { ...placements };
      delete newPlacements[itemId];
      setPlacements(newPlacements);
      logEvent("TASK_MOVED", { itemId, target: "inbox" });
    } else {
      const [targetDay, targetHourStr] = targetId.split("-");
      const targetHour = parseInt(targetHourStr);
      const hasOverlap = checkOverlap(targetDay, targetHour, item.duration, itemId, placements, allItems);

      if (hasOverlap) {
        setError("Overlap detected!");
        setTimeout(() => setError(null), 2000);
        return;
      }

      setPlacements((prev) => ({ ...prev, [itemId]: targetId }));
      logEvent("TASK_SCHEDULED", { itemId, day: targetDay, hour: targetHour });
    }
  };

  const inboxItems = allItems.filter((item) => !placements[item.id]);
  const getItemForSlot = (slotId) => {
    const itemId = Object.keys(placements).find((key) => placements[key] === slotId);
    return itemId ? allItems.find((i) => i.id === itemId) : null;
  };

  if (loading) return <div className="page-container">Loading...</div>;

  // --- ITEM COMPONENT ---
  const ItemComponent = ({ item, isOverlay, isInInbox }) => {
    // Als het in de inbox zit, gebruiken we compacte styling (45px hoog)
    // Als het in de planner zit (of overlay), gebruiken we de echte tijdsduur.
    const height =
      isInInbox && !isOverlay
        ? "auto" // Laat CSS (.inbox-item) de hoogte bepalen
        : `${item.duration * ROW_HEIGHT - 4}px`;

    // Bepaal welke classes we gebruiken
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
          // In rooster: padding 5px. In inbox: wordt geregeld door CSS class
          padding: isInInbox && !isOverlay ? "" : "5px",
        }}
      >
        <strong>{item.name}</strong>

        {/* Toon tijdsduur badge */}
        <span
          className="duration-badge"
          style={{
            fontSize: "0.7rem",
            marginLeft: isInInbox && !isOverlay ? "auto" : "0",
            display: isInInbox && !isOverlay ? "block" : "block",
          }}
        >
          {item.duration}h
        </span>

        {/* EDIT BUTTON (Potloodje) */}
        <button className="edit-btn" title="Edit" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => openEditModal(item, e)}>
          ✎
        </button>

        {/* DELETE BUTTON (Kruisje) */}
        <button className="delete-btn" title="Delete" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => handleDelete(item.id, e)}>
          ✕
        </button>
      </div>
    );
  };

  // --- MODAL FORM ---
  const renderModalForm = (onSubmit, title, cancelAction) => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <form onSubmit={onSubmit}>
          <label>Name</label>
          <input type="text" value={formData.name} required onChange={(e) => setFormData({ ...formData, name: e.target.value })} />

          <label>Duration (hours)</label>
          <input type="number" min="0.5" max="8" step="0.5" value={formData.duration} required onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />

          <label>Color</label>
          <div className="color-options">
            {COLORS.map((c, i) => (
              <div key={i} className={`color-swatch ${formData.colorIndex === i ? "selected" : ""}`} style={{ background: c.bg, borderColor: c.border }} onClick={() => setFormData({ ...formData, colorIndex: i })} />
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={cancelAction}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="planner-wrapper" style={{ display: "flex", gap: "20px", height: "85vh", flexDirection: "column" }}>
        {error && <div style={{ background: "#ffebee", color: "#c62828", padding: "10px", textAlign: "center", fontWeight: "bold" }}>{error}</div>}

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* --- ROOSTER --- */}
          <div className="planner-main" style={{ flex: 4, display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div className="schedule-header">
              <div className="header-cell">Time</div>
              {DAYS.map((day) => (
                <div key={day} className="header-cell">
                  {day}
                </div>
              ))}
            </div>

            <div className="schedule-grid">
              {HOURS.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="time-label">{hour}:00</div>
                  {DAYS.map((day) => {
                    const slotId = `${day}-${hour}`;
                    const itemInSlot = getItemForSlot(slotId);
                    return (
                      <Droppable key={slotId} id={slotId}>
                        <div className="time-slot">
                          {itemInSlot && (
                            <Draggable id={itemInSlot.id} data={itemInSlot}>
                              <ItemComponent item={itemInSlot} isOverlay={false} isInInbox={false} />
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

          {/* --- SIDEBAR --- */}
          <div className="planner-sidebar" style={{ flex: 1, display: "flex", flexDirection: "column", marginLeft: "20px" }}>
            {/* BIG CREATE BUTTON */}
            <button className="add-task-btn" onClick={openCreateModal} title="Create Task">
              {" "}
              +{" "}
            </button>

            <Droppable id="inbox">
              <div style={{ background: "white", padding: "15px", height: "100%", overflowY: "auto", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                <h3>Inbox ({inboxItems.length})</h3>
                <hr />
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {inboxItems.map((item) => (
                    <Draggable key={item.id} id={item.id} data={item}>
                      {/* HIER ZEGGEN WE DAT HET EEN INBOX ITEM IS */}
                      <ItemComponent item={item} isOverlay={false} isInInbox={true} />
                    </Draggable>
                  ))}
                </div>
              </div>
            </Droppable>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showCreateModal && renderModalForm(handleCreateSubmit, "New Task", () => setShowCreateModal(false))}
      {editingItem && renderModalForm(handleEditSubmit, "Edit Task", () => setEditingItem(null))}

      {/* DRAG OVERLAY */}
      <DragOverlay>
        {activeId ? (
          <div style={{ width: "140px", opacity: 0.9 }}>
            {/* Overlay is nooit 'inbox', want je sleept hem. Hij moet ware grootte hebben. */}
            <ItemComponent item={allItems.find((i) => i.id === activeId)} isOverlay={true} isInInbox={false} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default WeekPlanner;
