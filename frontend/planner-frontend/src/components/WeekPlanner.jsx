import React, { useState, useEffect } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core"; // DragOverlay voor visuele feedback
import { fetchUserProfile } from "../api/auth";
import { logEvent } from "../api/logging";
import { Draggable } from "./Draggable";
import { Droppable } from "./Droppable";
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function WeekPlanner() {
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState([]);
  const [placements, setPlacements] = useState({});

  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("userToken");
      try {
        const data = await fetchUserProfile(token);
        const prefs = data.initialPreferences;

        let generatedItems = [];

        prefs.hobbies.forEach((hobby, index) => {
          const freq = parseInt(hobby.frequency) || 1;
          for (let i = 0; i < freq; i++) {
            generatedItems.push({
              id: `hobby-${index}-${i}`,
              duration: hobby.duration || 1,
              type: "HOBBY",
              color: "#e3f2fd",
              borderColor: "#2196f3",
            });
          }
        });

        for (let i = 0; i < 5; i++) {
          generatedItems.push({
            id: `work-${i}`,
            name: "Work",
            duration: 4,
            type: "WORK",
            color: "#ffecd1",
            borderColor: "orange",
          });
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

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const itemId = active.id;
    const targetId = over.id;

    logEvent("TASK_MOVED", { itemId, target: targetId });

    if (targetId === "inbox") {
      const newPlacements = { ...placements };
      delete newPlacements[itemId];
      setPlacements(newPlacements);
    } else {
      setPlacements((prev) => ({
        ...prev,
        [itemId]: targetId,
      }));
    }
  };
  const inboxItems = allItems.filter((item) => !placements[item.id]);
  const getItemForSlot = (slotId) => {
    const itemId = Object.keys(placements).find((key) => placements[key] === slotId);
    if (!itemId) return null;
    return allItems.find((i) => i.id === itemId);
  };

  if (loading) return <div>Loading...</div>;
  const ItemComponent = ({ item }) => (
    <div
      className="draggable-item"
      style={{
        background: item.color,
        borderLeft: `4px solid ${item.borderColor}`,
        padding: "5px",
        borderRadius: "4px",
        height: "100%",
        fontSize: "0.8rem",
      }}
    >
      <strong>{item.name}</strong>
      <div>{item.duration}h</div>
    </div>
  );

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="planner-wrapper" style={{ display: "flex", gap: "20px", height: "85vh" }}>
        <div className="planner-main" style={{ flex: 4, display: "flex", flexDirection: "column" }}>
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
                            <div
                              className="scheduled-task"
                              style={{
                                background: itemInSlot.color,
                                borderLeft: `4px solid ${itemInSlot.borderColor}`,
                              }}
                            >
                              <strong>{itemInSlot.name}</strong>
                            </div>
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

        <div className="planner-sidebar" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Droppable id="inbox">
            <div
              style={{
                background: "white",
                padding: "15px",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                height: "100%",
                overflowY: "auto",
              }}
            >
              <h3>Inbox</h3>
              <p style={{ fontSize: "0.8rem", color: "#666" }}>Drag items here to remove them from the plan.</p>
              <hr />

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {inboxItems.map((item) => (
                  <Draggable key={item.id} id={item.id} data={item}>
                    <ItemComponent item={item} />
                  </Draggable>
                ))}
                {inboxItems.length === 0 && <p style={{ color: "green" }}>All planned!</p>}
              </div>
            </div>
          </Droppable>
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <div style={{ width: "150px" }}>
            <ItemComponent item={allItems.find((i) => i.id === activeId)} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default WeekPlanner;
