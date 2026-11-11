import React from "react";
import type {
  InteractionStudioState,
  InteractionEventCategory,
  InteractionEventLogItem,
} from "../../types/interactions.js";

interface EventInspectorTimelineProps {
  state: InteractionStudioState;
  onChange: (updater: (prev: InteractionStudioState) => InteractionStudioState) => void;
}

export const EventInspectorTimeline: React.FC<EventInspectorTimelineProps> = ({
  state,
  onChange,
}) => {
  const { eventStream, isEventCapturePaused, eventCategoryFilter, selectedEventId } = state;

  const categories: ("all" | InteractionEventCategory)[] = [
    "all",
    "pointer",
    "drag",
    "touch",
    "gesture",
    "sequence",
    "magnetic",
    "cursor",
  ];

  const filteredStream = eventStream.filter((ev) => {
    if (eventCategoryFilter === "all") return true;
    return ev.category === eventCategoryFilter;
  });

  const selectedEvent = eventStream.find((ev) => ev.id === selectedEventId);

  const handleTogglePause = () => {
    onChange((prev) => ({
      ...prev,
      isEventCapturePaused: !prev.isEventCapturePaused,
    }));
  };

  const handleClearHistory = () => {
    onChange((prev) => ({
      ...prev,
      eventStream: [],
      selectedEventId: null,
    }));
  };

  const handleSelectCategory = (cat: "all" | InteractionEventCategory) => {
    onChange((prev) => ({
      ...prev,
      eventCategoryFilter: cat,
    }));
  };

  const handleSelectEvent = (id: string) => {
    onChange((prev) => ({
      ...prev,
      selectedEventId: prev.selectedEventId === id ? null : id,
    }));
  };

  return (
    <div className="ip-timeline-container">
      {/* Timeline Controls Header */}
      <div className="ip-timeline-header">
        <div className="ip-timeline-actions">
          <button
            type="button"
            className={`studio-btn studio-btn-sm ${isEventCapturePaused ? "active" : ""}`}
            onClick={handleTogglePause}
          >
            {isEventCapturePaused ? "▶ Resume Stream" : "⏸ Pause Stream"}
          </button>
          <button
            type="button"
            className="studio-btn studio-btn-sm"
            onClick={handleClearHistory}
          >
            🗑 Clear ({eventStream.length})
          </button>
        </div>

        {/* Category Filters */}
        <div className="ip-category-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`ip-cat-btn ${eventCategoryFilter === cat ? "active" : ""}`}
              onClick={() => handleSelectCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Timeline Stream & Detail Split */}
      <div className="ip-timeline-split">
        {/* Stream List */}
        <div className="ip-event-list">
          {filteredStream.length === 0 ? (
            <div className="ip-empty-stream">
              <span>No interaction events recorded in this category yet.</span>
            </div>
          ) : (
            filteredStream.map((ev) => {
              const isSelected = ev.id === selectedEventId;
              return (
                <div
                  key={ev.id}
                  className={`ip-event-row ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectEvent(ev.id)}
                >
                  <div className="ip-ev-badge-col">
                    <span className={`ip-ev-badge ip-ev-${ev.category}`}>
                      {ev.category}
                    </span>
                    <span className="ip-ev-type">{ev.type}</span>
                  </div>

                  <div className="ip-ev-details-col">
                    {ev.targetId && <span className="ip-ev-target">{ev.targetId}</span>}
                    {ev.x !== undefined && ev.y !== undefined && (
                      <span className="ip-ev-coords">
                        ({ev.x}, {ev.y})
                      </span>
                    )}
                    {ev.details && <span className="ip-ev-desc">{ev.details}</span>}
                  </div>

                  <div className="ip-ev-time-col">
                    <span>
                      +{Math.max(0, ev.timestamp - (eventStream[eventStream.length - 1]?.timestamp || 0))}ms
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Event JSON Inspector */}
        {selectedEvent && (
          <div className="ip-event-inspector">
            <div className="ip-inspector-header">
              <span className="ip-inspector-title">Event Detail Inspector</span>
              <button
                type="button"
                className="studio-btn studio-btn-xs"
                onClick={() => handleSelectEvent(selectedEvent.id)}
              >
                ✕ Close
              </button>
            </div>
            <pre className="ip-inspector-json">
              {JSON.stringify(selectedEvent, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
