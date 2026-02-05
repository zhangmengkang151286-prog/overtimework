# Requirements Document

## Introduction

This document specifies the requirements for fixing the tag display issue in the Overtime Index App. Users are reporting that the tag list (legend) on the left side of the grid chart is not displaying correctly or is showing incorrect data.

## Glossary

- **Tag Distribution**: The collection of tags with their associated counts and status (overtime/on-time)
- **Grid Chart**: The GitHub-style visualization showing tag distribution as colored squares
- **Legend**: The list of tags displayed below the grid chart showing tag names, colors, counts, and percentages
- **Top Tags Function**: The database function `get_top_tags` that returns the most frequently used tags
- **Tag Stats**: Statistics for each tag including overtime count, on-time count, and total count

## Requirements

### Requirement 1

**User Story:** As a user, I want to see accurate tag information in the legend, so that I can understand which tags are being used and their distribution.

#### Acceptance Criteria

1. WHEN the app fetches tag data from the database THEN the system SHALL retrieve all tag fields including tag_id, tag_name, overtime_count, on_time_count, and total_count
2. WHEN tag data is transformed for display THEN the system SHALL preserve all tag information without data loss
3. WHEN the legend is rendered THEN the system SHALL display each tag's name, count, and percentage accurately
4. WHEN a tag has zero count THEN the system SHALL exclude it from the display
5. WHEN tag data is updated THEN the system SHALL reflect changes in the legend within 7 seconds

### Requirement 2

**User Story:** As a user, I want the tag colors in the legend to match the colors in the grid chart, so that I can easily identify which squares correspond to which tags.

#### Acceptance Criteria

1. WHEN colors are assigned to tags THEN the system SHALL use a consistent color generation algorithm
2. WHEN overtime tags are displayed THEN the system SHALL use red gradient colors from #dc2626 to #fca5a5
3. WHEN on-time tags are displayed THEN the system SHALL use green gradient colors from #16a34a to #86efac
4. WHEN the legend is rendered THEN the system SHALL use the same colors as the grid squares
5. WHEN a user selects a tag THEN the system SHALL highlight both the legend item and corresponding grid squares

### Requirement 3

**User Story:** As a developer, I want clear logging and error handling for tag data processing, so that I can quickly diagnose and fix display issues.

#### Acceptance Criteria

1. WHEN tag data is fetched THEN the system SHALL log the number of tags retrieved and their basic statistics
2. WHEN tag data transformation occurs THEN the system SHALL log any data inconsistencies or errors
3. WHEN the grid allocation algorithm runs THEN the system SHALL log the allocation results for verification
4. IF tag data fetching fails THEN the system SHALL display an error message and use cached data if available
5. WHEN debugging is enabled THEN the system SHALL provide detailed logs of the entire data flow from database to display

### Requirement 4

**User Story:** As a user, I want to see only tags with actual usage, so that the display is not cluttered with empty tags.

#### Acceptance Criteria

1. WHEN processing tag distribution THEN the system SHALL filter out tags with zero total_count
2. WHEN separating overtime and on-time tags THEN the system SHALL only include tags with count > 0
3. WHEN displaying the legend THEN the system SHALL show only tags that have corresponding grid squares
4. WHEN all tags have zero count THEN the system SHALL display an appropriate "no data" message
5. WHEN tag counts are updated THEN the system SHALL dynamically add or remove tags from the display
