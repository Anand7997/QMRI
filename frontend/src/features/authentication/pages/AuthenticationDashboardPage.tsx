import { useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Checkbox,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DoneAllOutlinedIcon from "@mui/icons-material/DoneAllOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import LockClockOutlinedIcon from "@mui/icons-material/LockClockOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SelectAllOutlinedIcon from "@mui/icons-material/SelectAllOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import { EmptyState, FormDrawer, KpiTile, PageHeader, TableSkeleton } from "shared/components";
import {
  useApproveUser,
  useCreateIdentityAccess,
  useCreateIdentityLink,
  useDeactivateUser,
  useUpdateUserAccess,
  useUsers,
  type ApprovalCategoryCode,
  type ApprovalRoleCode,
  type CreateIdentityAccessResponse,
  type CreateIdentityLinkResponse,
  type UserAccessRequest,
  type UserStatusFilter,
} from "shared/api/users";

type FilterTab = UserStatusFilter;
type IdentityDurationUnit = "hours" | "days";
type IdentityGenerationMode = "tokens" | "link";
type Feedback = { severity: "error" | "info" | "success"; message: string };

const filterTabs: { label: string; value: FilterTab }[] = [
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "All", value: "all" },
];

const defaultApprovalRole: ApprovalRoleCode = "USER";
const guestApprovalRole: ApprovalRoleCode = "GUEST";
const defaultApprovalCategory: ApprovalCategoryCode = "Fresher";
const guestApprovalCategory: ApprovalCategoryCode = "Guest";

const approvalCategories: ApprovalCategoryCode[] = ["Fresher", "Digital", "Ai", "QE", "Delevery", "Guest", "Client"];
const standardApprovalRoles: ApprovalRoleCode[] = ["USER", "ADMIN"];
const guestAwareApprovalRoles: ApprovalRoleCode[] = ["USER", "ADMIN", "GUEST"];

export function AuthenticationDashboardPage() {
  const [filter, setFilter] = useState<FilterTab>("Pending");
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [roleByUserId, setRoleByUserId] = useState<Record<string, ApprovalRoleCode>>({});
  const [categoryByUserId, setCategoryByUserId] = useState<Record<string, ApprovalCategoryCode>>({});
  const [identityDrawerOpen, setIdentityDrawerOpen] = useState(false);
  const [identityGenerationMode, setIdentityGenerationMode] = useState<IdentityGenerationMode>("tokens");
  const [identityEmail, setIdentityEmail] = useState("");
  const [identityDurationValue, setIdentityDurationValue] = useState("7");
  const [identityDurationUnit, setIdentityDurationUnit] = useState<IdentityDurationUnit>("days");
  const [identityExpiresAtLocal, setIdentityExpiresAtLocal] = useState(() =>
    toLocalDateTimeInput(addDuration(new Date(), 7, "days")),
  );
  const [identityFeedback, setIdentityFeedback] = useState<Feedback | null>(null);
  const [createdIdentityAccess, setCreatedIdentityAccess] = useState<CreateIdentityAccessResponse | null>(null);
  const [identityLinkFullName, setIdentityLinkFullName] = useState("");
  const [identityLinkEmail, setIdentityLinkEmail] = useState("");
  const [identityLinkCategory, setIdentityLinkCategory] = useState<ApprovalCategoryCode>(defaultApprovalCategory);
  const [identityLinkDurationValue, setIdentityLinkDurationValue] = useState("7");
  const [identityLinkDurationUnit, setIdentityLinkDurationUnit] = useState<IdentityDurationUnit>("days");
  const [identityLinkExpiresAtLocal, setIdentityLinkExpiresAtLocal] = useState(() =>
    toLocalDateTimeInput(addDuration(new Date(), 7, "days")),
  );
  const [identityLinkFeedback, setIdentityLinkFeedback] = useState<Feedback | null>(null);
  const [createdIdentityLink, setCreatedIdentityLink] = useState<CreateIdentityLinkResponse | null>(null);

  const { data: users = [], isLoading, isError } = useUsers("all");
  const approveUser = useApproveUser();
  const createIdentityAccess = useCreateIdentityAccess();
  const createIdentityLink = useCreateIdentityLink();
  const updateUserAccess = useUpdateUserAccess();
  const deactivateUser = useDeactivateUser();

  const filteredUsers = useMemo(() => {
    return filter === "all" ? users : users.filter((user) => user.approvalStatus === filter);
  }, [filter, users]);

  const pendingFilteredUsers = filteredUsers.filter((user) => user.approvalStatus === "Pending");
  const pendingFilteredIds = pendingFilteredUsers.map((user) => user.userId);
  const approvedFilteredIds = filteredUsers.filter((user) => user.approvalStatus === "Approved" && user.isActive).map((user) => user.userId);
  const filteredIds = filteredUsers.map((user) => user.userId);
  const selectedPendingIds = selectedIds.filter((id) => pendingFilteredIds.includes(id));
  const selectedApprovedIds = selectedIds.filter((id) => approvedFilteredIds.includes(id));
  const isAllFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
  const isSomeFilteredSelected = selectedIds.some((id) => filteredIds.includes(id)) && !isAllFilteredSelected;

  const pendingCount = users.filter((user) => user.approvalStatus === "Pending").length;
  const approvedCount = users.filter((user) => user.approvalStatus === "Approved").length;
  const adminRequestCount = users.filter((user) => user.requestedRoleCode.toUpperCase() === "ADMIN").length;
  const activeUserCount = users.filter((user) => user.isActive).length;

  function approvalRoleFor(user: UserAccessRequest) {
    return roleByUserId[user.userId]
      ?? (user.roles.some((role) => role.toUpperCase() === guestApprovalRole) || user.requestedRoleCode.toUpperCase() === guestApprovalRole
        ? guestApprovalRole
        : user.roles.some((role) => role.toUpperCase() === "ADMIN") || user.requestedRoleCode.toUpperCase() === "ADMIN"
          ? "ADMIN"
          : defaultApprovalRole);
  }

  function approvalCategoryFor(user: UserAccessRequest) {
    return approvalRoleFor(user) === guestApprovalRole
      ? guestApprovalCategory
      : categoryByUserId[user.userId] ?? normalizeCategory(user.category);
  }

  function roleOptionsFor(user: UserAccessRequest) {
    return user.roles.some((role) => role.toUpperCase() === guestApprovalRole) || user.requestedRoleCode.toUpperCase() === guestApprovalRole
      ? guestAwareApprovalRoles
      : standardApprovalRoles;
  }

  function handleToggleUser(userId: string) {
    setSelectedIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  }

  function handleToggleAllFiltered() {
    setSelectedIds((current) => {
      if (isAllFilteredSelected) {
        return current.filter((id) => !filteredIds.includes(id));
      }

      return Array.from(new Set([...current, ...filteredIds]));
    });
  }

  function handleRoleChange(userId: string, event: SelectChangeEvent<ApprovalRoleCode>) {
    const nextRole = event.target.value as ApprovalRoleCode;
    setRoleByUserId((current) => ({ ...current, [userId]: nextRole }));
    setCategoryByUserId((current) => ({
      ...current,
      [userId]: nextRole === guestApprovalRole ? guestApprovalCategory : current[userId] === guestApprovalCategory ? defaultApprovalCategory : current[userId] ?? defaultApprovalCategory,
    }));
  }

  function handleCategoryChange(userId: string, event: SelectChangeEvent<ApprovalCategoryCode>) {
    setCategoryByUserId((current) => ({ ...current, [userId]: event.target.value as ApprovalCategoryCode }));
  }

  function handleApprove(userId: string) {
    const user = users.find((candidate) => candidate.userId === userId);

    setApprovingUserId(userId);
    approveUser.mutate(
      {
        userId,
        roleCode: user ? approvalRoleFor(user) : defaultApprovalRole,
        category: user ? approvalCategoryFor(user) : defaultApprovalCategory,
      },
      {
        onSuccess: () => setSelectedIds((current) => current.filter((id) => id !== userId)),
        onSettled: () => setApprovingUserId(null),
      },
    );
  }

  async function handleApproveAll() {
    setApprovingUserId("bulk");
    try {
      for (const userId of selectedPendingIds) {
        const user = users.find((candidate) => candidate.userId === userId);
        await approveUser.mutateAsync({
          userId,
          roleCode: user ? approvalRoleFor(user) : defaultApprovalRole,
          category: user ? approvalCategoryFor(user) : defaultApprovalCategory,
        });
      }
      setSelectedIds((current) => current.filter((id) => !selectedPendingIds.includes(id)));
    } finally {
      setApprovingUserId(null);
    }
  }

  async function handleSaveUser(user: UserAccessRequest) {
    setApprovingUserId(user.userId);
    try {
      await updateUserAccess.mutateAsync({
        userId: user.userId,
        roleCode: approvalRoleFor(user),
        category: approvalCategoryFor(user),
        isActive: true,
      });
    } finally {
      setApprovingUserId(null);
    }
  }

  async function handleDeactivateUsers(userIds: string[]) {
    setApprovingUserId("deactivate");
    try {
      for (const userId of userIds) {
        await deactivateUser.mutateAsync(userId);
      }
      setSelectedIds((current) => current.filter((id) => !userIds.includes(id)));
    } finally {
      setApprovingUserId(null);
    }
  }

  function openIdentityDrawer() {
    setIdentityDrawerOpen(true);
    setIdentityGenerationMode("tokens");
    setIdentityEmail("");
    setIdentityDurationValue("7");
    setIdentityDurationUnit("days");
    setIdentityExpiresAtLocal(toLocalDateTimeInput(addDuration(new Date(), 7, "days")));
    setIdentityFeedback(null);
    setCreatedIdentityAccess(null);
    setIdentityLinkFullName("");
    setIdentityLinkEmail("");
    setIdentityLinkCategory(defaultApprovalCategory);
    setIdentityLinkDurationValue("7");
    setIdentityLinkDurationUnit("days");
    setIdentityLinkExpiresAtLocal(toLocalDateTimeInput(addDuration(new Date(), 7, "days")));
    setIdentityLinkFeedback(null);
    setCreatedIdentityLink(null);
  }

  function updateIdentityExpiry(durationValue: string, unit: IdentityDurationUnit) {
    setIdentityDurationValue(durationValue);
    setIdentityDurationUnit(unit);

    const parsedDuration = Number(durationValue);
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      return;
    }

    setIdentityExpiresAtLocal(toLocalDateTimeInput(addDuration(new Date(), parsedDuration, unit)));
  }

  async function handleCreateIdentityAccess() {
    setIdentityFeedback(null);

    if (!identityEmail.trim()) {
      setIdentityFeedback({ severity: "error", message: "Enter the guest email address." });
      return;
    }

    const parsedDuration = Number(identityDurationValue);
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      setIdentityFeedback({ severity: "error", message: "Enter a valid access duration." });
      return;
    }

    const expiresAt = new Date(identityExpiresAtLocal);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      setIdentityFeedback({ severity: "error", message: "Set an expiry date and time in the future." });
      return;
    }

    try {
      const result = await createIdentityAccess.mutateAsync({
        email: identityEmail.trim(),
        expiresAtUtc: expiresAt.toISOString(),
      });

      setCreatedIdentityAccess(result);
      setIdentityFeedback({
        severity: "success",
        message: "Guest identity access created. Copy the access code now because it is only shown once.",
      });
      setFilter("Approved");
    } catch (error) {
      setCreatedIdentityAccess(null);
      setIdentityFeedback({
        severity: "error",
        message: getApiMessage(error) ?? "Unable to create guest identity access right now.",
      });
    }
  }

  async function copyAccessCode() {
    if (!createdIdentityAccess) {
      return;
    }

    await navigator.clipboard.writeText(createdIdentityAccess.accessCode);
    setIdentityFeedback({ severity: "success", message: "Access code copied to the clipboard." });
  }

  function updateIdentityLinkExpiry(durationValue: string, unit: IdentityDurationUnit) {
    setIdentityLinkDurationValue(durationValue);
    setIdentityLinkDurationUnit(unit);

    const parsedDuration = Number(durationValue);
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      return;
    }

    setIdentityLinkExpiresAtLocal(toLocalDateTimeInput(addDuration(new Date(), parsedDuration, unit)));
  }

  async function handleCreateIdentityLink() {
    setIdentityLinkFeedback(null);

    if (!identityLinkFullName.trim()) {
      setIdentityLinkFeedback({ severity: "error", message: "Enter the client name." });
      return;
    }

    if (!identityLinkEmail.trim()) {
      setIdentityLinkFeedback({ severity: "error", message: "Enter the client email address." });
      return;
    }

    const parsedDuration = Number(identityLinkDurationValue);
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      setIdentityLinkFeedback({ severity: "error", message: "Enter a valid link duration." });
      return;
    }

    const expiresAt = new Date(identityLinkExpiresAtLocal);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      setIdentityLinkFeedback({ severity: "error", message: "Set an expiry date and time in the future." });
      return;
    }

    try {
      const result = await createIdentityLink.mutateAsync({
        fullName: identityLinkFullName.trim(),
        email: identityLinkEmail.trim(),
        category: identityLinkCategory,
        expiresAtUtc: expiresAt.toISOString(),
        frontendBaseUrl: window.location.origin,
      });

      setCreatedIdentityLink(result);
      setIdentityLinkFeedback({
        severity: "success",
        message: "Client identity link generated. Copy it now because it is only shown once.",
      });
      setFilter("Approved");
    } catch (error) {
      setCreatedIdentityLink(null);
      setIdentityLinkFeedback({
        severity: "error",
        message: getApiMessage(error) ?? "Unable to generate a client identity link right now.",
      });
    }
  }

  async function copyIdentityLink() {
    if (!createdIdentityLink) {
      return;
    }

    await navigator.clipboard.writeText(createdIdentityLink.link);
    setIdentityLinkFeedback({ severity: "success", message: "Identity link copied to the clipboard." });
  }

  const identityAccessGenerated = Boolean(createdIdentityAccess);
  const identityLinkGenerated = Boolean(createdIdentityLink);
  const identityModeGenerated = identityGenerationMode === "tokens" ? identityAccessGenerated : identityLinkGenerated;
  const identityModePending = identityGenerationMode === "tokens" ? createIdentityAccess.isPending : createIdentityLink.isPending;
  const identitySubmitLabel = identityModeGenerated
    ? "Close"
    : identityGenerationMode === "tokens"
      ? identityModePending ? "Generating..." : "Generate tokens"
      : identityModePending ? "Generating..." : "Generate link";
  const handleIdentitySubmit = identityModeGenerated
    ? () => setIdentityDrawerOpen(false)
    : identityGenerationMode === "tokens"
      ? handleCreateIdentityAccess
      : handleCreateIdentityLink;

  return (
    <Box>
      <PageHeader
        title="Authentication"
        subtitle="Approve signup requests before users can access their dashboards."
        actions={(
          <Button variant="contained" startIcon={<VpnKeyOutlinedIcon />} onClick={openIdentityDrawer} sx={{ whiteSpace: "nowrap" }}>
            Identity Access
          </Button>
        )}
      />

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, mb: 2 }}>
        <KpiTile label="Pending requests" value={pendingCount} icon={<LockClockOutlinedIcon />} />
        <KpiTile label="Approved accounts" value={approvedCount} icon={<VerifiedUserOutlinedIcon />} />
        <KpiTile label="Active users" value={activeUserCount} icon={<GroupOutlinedIcon />} />
        <KpiTile label="Admin requests" value={adminRequestCount} icon={<AdminPanelSettingsOutlinedIcon />} />
      </Box>

      <Card>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          alignItems={{ xs: "stretch", lg: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ px: 2.5, pt: 2 }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h3">Access approval queue</Typography>
              <Chip size="small" label={`${pendingCount} pending`} color={pendingCount ? "warning" : "success"} />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Select each user role and category before approving access.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
            <Button
              variant="outlined"
              startIcon={<SelectAllOutlinedIcon />}
              disabled={filteredIds.length === 0 || approveUser.isPending || updateUserAccess.isPending || deactivateUser.isPending}
              onClick={handleToggleAllFiltered}
            >
              Select all
            </Button>
            <Button
              variant="contained"
              startIcon={approvingUserId === "bulk" ? <CircularProgress size={16} color="inherit" /> : <DoneAllOutlinedIcon />}
              disabled={selectedPendingIds.length === 0 || approveUser.isPending}
              onClick={handleApproveAll}
            >
              Approve all ({selectedPendingIds.length})
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              disabled={selectedApprovedIds.length === 0 || deactivateUser.isPending}
              onClick={() => handleDeactivateUsers(selectedApprovedIds)}
            >
              Delete ({selectedApprovedIds.length})
            </Button>
            <Tabs value={filter} onChange={(_, value: FilterTab) => setFilter(value)}>
              {filterTabs.map((tab) => (
                <Tab key={tab.value} label={tab.label} value={tab.value} sx={{ cursor: "pointer" }} />
              ))}
            </Tabs>
          </Stack>
        </Stack>

        {approveUser.isError || updateUserAccess.isError || deactivateUser.isError ? (
          <Alert severity="error" sx={{ mx: 2.5, mt: 2 }}>Unable to save one or more account changes.</Alert>
        ) : null}
        {isError ? <Alert severity="error" sx={{ mx: 2.5, mt: 2 }}>Unable to load authentication requests.</Alert> : null}

        {isLoading ? (
          <TableSkeleton rows={6} cols={9} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={<PersonAddAltOutlinedIcon sx={{ fontSize: 40 }} />}
            title={filter === "Pending" ? "No pending requests" : "No accounts found"}
            description={filter === "Pending" ? "New signup requests will appear here for approval." : "Try a different filter."}
          />
        ) : (
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Table sx={{ minWidth: 1260 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isAllFilteredSelected}
                      indeterminate={isSomeFilteredSelected}
                      disabled={filteredIds.length === 0}
                      onChange={handleToggleAllFiltered}
                      inputProps={{ "aria-label": "Select all visible accounts" }}
                    />
                  </TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Requested role</TableCell>
                  <TableCell>Approve as</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell>Requested</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => {
                  const isPending = user.approvalStatus === "Pending";
                  const selectedRole = approvalRoleFor(user);
                  const selectedCategory = approvalCategoryFor(user);
                  const roleOptions = roleOptionsFor(user);

                  return (
                    <TableRow key={user.userId} hover selected={selectedIds.includes(user.userId)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(user.userId)}
                          disabled={approveUser.isPending || updateUserAccess.isPending || deactivateUser.isPending}
                          onChange={() => handleToggleUser(user.userId)}
                          inputProps={{ "aria-label": `Select ${user.fullName}` }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body1" fontWeight={700} noWrap>
                            {user.fullName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {user.email} / {user.userName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <RoleChip role={user.requestedRoleCode} />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 112 }}>
                          <Select value={selectedRole} onChange={(event) => handleRoleChange(user.userId, event)}>
                            {roleOptions.map((role) => (
                              <MenuItem key={role} value={role}>
                                {labelRole(role)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 132 }}>
                          <Select
                            value={selectedCategory}
                            onChange={(event) => handleCategoryChange(user.userId, event)}
                            disabled={selectedRole === guestApprovalRole}
                          >
                            {(selectedRole === guestApprovalRole ? [guestApprovalCategory] : approvalCategories.filter((category) => category !== guestApprovalCategory)).map((category) => (
                              <MenuItem key={category} value={category}>
                                {category}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <ApprovalChip user={user} />
                      </TableCell>
                      <TableCell>{formatIdentityExpiry(user.identityAccessExpiresAtUtc ?? user.identityLinkExpiresAtUtc)}</TableCell>
                      <TableCell>{formatDateTime(user.requestedAtUtc)}</TableCell>
                      <TableCell align="right">
                        {isPending ? (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={approvingUserId === user.userId ? <CircularProgress size={16} color="inherit" /> : <HowToRegOutlinedIcon />}
                            disabled={approveUser.isPending}
                            onClick={() => handleApprove(user.userId)}
                          >
                            Accept as {labelRole(selectedRole)}
                          </Button>
                        ) : (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<SaveOutlinedIcon />}
                              disabled={updateUserAccess.isPending || deactivateUser.isPending}
                              onClick={() => handleSaveUser(user)}
                            >
                              Save
                            </Button>
                            {user.isActive ? (
                              <Button
                                size="small"
                                color="error"
                                startIcon={<DeleteOutlineIcon />}
                                disabled={deactivateUser.isPending}
                                onClick={() => handleDeactivateUsers([user.userId])}
                              >
                                Delete
                              </Button>
                            ) : null}
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>
      <FormDrawer
        open={identityDrawerOpen}
        onClose={() => setIdentityDrawerOpen(false)}
        onSubmit={handleIdentitySubmit}
        submitLabel={identitySubmitLabel}
        submitting={!identityModeGenerated && identityModePending}
        title="Identity Access"
        width={560}
      >
        <Stack spacing={2.25}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant={identityGenerationMode === "tokens" ? "contained" : "outlined"}
              startIcon={<VpnKeyOutlinedIcon />}
              onClick={() => setIdentityGenerationMode("tokens")}
              disabled={identityModePending}
              fullWidth
            >
              Generate tokens
            </Button>
            <Button
              variant={identityGenerationMode === "link" ? "contained" : "outlined"}
              startIcon={<LinkOutlinedIcon />}
              onClick={() => setIdentityGenerationMode("link")}
              disabled={identityModePending}
              fullWidth
            >
              Generate link
            </Button>
          </Stack>

          {identityGenerationMode === "tokens" ? (
            <>
              {identityFeedback ? <Alert severity={identityFeedback.severity}>{identityFeedback.message}</Alert> : null}
              <Alert severity="info">
                Guests receive approved access immediately. Share the one-time access code securely after creating the record.
              </Alert>

              <TextField
                label="Guest email"
                type="email"
                value={identityEmail}
                onChange={(event) => setIdentityEmail(event.target.value)}
                fullWidth
                required
                disabled={createIdentityAccess.isPending || identityAccessGenerated}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  label="Amount of time"
                  type="number"
                  value={identityDurationValue}
                  onChange={(event) => updateIdentityExpiry(event.target.value, identityDurationUnit)}
                  inputProps={{ min: 1 }}
                  fullWidth
                  disabled={createIdentityAccess.isPending || identityAccessGenerated}
                />
                <FormControl fullWidth>
                  <Select
                    value={identityDurationUnit}
                    onChange={(event) => updateIdentityExpiry(identityDurationValue, event.target.value as IdentityDurationUnit)}
                    disabled={createIdentityAccess.isPending || identityAccessGenerated}
                  >
                    <MenuItem value="hours">Hours</MenuItem>
                    <MenuItem value="days">Days</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <TextField
                label="Expiry date and time"
                type="datetime-local"
                value={identityExpiresAtLocal}
                onChange={(event) => setIdentityExpiresAtLocal(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
                disabled={createIdentityAccess.isPending || identityAccessGenerated}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField label="Approval" value="Approved" fullWidth disabled />
                <TextField label="Category" value="Guest" fullWidth disabled />
              </Stack>

              {createdIdentityAccess ? (
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1.25}>
                    <Typography variant="h4">Guest access created</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Email: {createdIdentityAccess.user.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expires: {formatDateTime(createdIdentityAccess.identityAccessExpiresAtUtc)}
                    </Typography>
                    <TextField label="One-time access code" value={createdIdentityAccess.accessCode} fullWidth InputProps={{ readOnly: true }} />
                    <Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={copyAccessCode} sx={{ alignSelf: "flex-start" }}>
                      Copy access code
                    </Button>
                  </Stack>
                </Card>
              ) : null}
            </>
          ) : (
            <>
              {identityLinkFeedback ? <Alert severity={identityLinkFeedback.severity}>{identityLinkFeedback.message}</Alert> : null}
              <Alert severity="info">
                This creates an approved client account and a secure one-time link that opens My Assessments directly.
              </Alert>

              <TextField
                label="Client name"
                value={identityLinkFullName}
                onChange={(event) => setIdentityLinkFullName(event.target.value)}
                fullWidth
                required
                disabled={createIdentityLink.isPending || identityLinkGenerated}
              />

              <TextField
                label="Client email"
                type="email"
                value={identityLinkEmail}
                onChange={(event) => setIdentityLinkEmail(event.target.value)}
                fullWidth
                required
                disabled={createIdentityLink.isPending || identityLinkGenerated}
              />

              <TextField
                select
                label="Category"
                value={identityLinkCategory}
                onChange={(event) => setIdentityLinkCategory(event.target.value as ApprovalCategoryCode)}
                fullWidth
                disabled={createIdentityLink.isPending || identityLinkGenerated}
              >
                {approvalCategories.filter((category) => category !== guestApprovalCategory).map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  label="Amount of time"
                  type="number"
                  value={identityLinkDurationValue}
                  onChange={(event) => updateIdentityLinkExpiry(event.target.value, identityLinkDurationUnit)}
                  inputProps={{ min: 1 }}
                  fullWidth
                  disabled={createIdentityLink.isPending || identityLinkGenerated}
                />
                <FormControl fullWidth>
                  <Select
                    value={identityLinkDurationUnit}
                    onChange={(event) => updateIdentityLinkExpiry(identityLinkDurationValue, event.target.value as IdentityDurationUnit)}
                    disabled={createIdentityLink.isPending || identityLinkGenerated}
                  >
                    <MenuItem value="hours">Hours</MenuItem>
                    <MenuItem value="days">Days</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <TextField
                label="Expiry date and time"
                type="datetime-local"
                value={identityLinkExpiresAtLocal}
                onChange={(event) => setIdentityLinkExpiresAtLocal(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
                disabled={createIdentityLink.isPending || identityLinkGenerated}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField label="Approval" value="Approved" fullWidth disabled />
                <TextField label="Role" value="Client" fullWidth disabled />
              </Stack>

              {createdIdentityLink ? (
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1.25}>
                    <Typography variant="h4">Client link generated</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Client: {createdIdentityLink.user.fullName} / {createdIdentityLink.user.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expires: {formatDateTime(createdIdentityLink.identityLinkExpiresAtUtc)}
                    </Typography>
                    <TextField label="Direct assessment link" value={createdIdentityLink.link} fullWidth multiline minRows={2} InputProps={{ readOnly: true }} />
                    <Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={copyIdentityLink} sx={{ alignSelf: "flex-start" }}>
                      Copy link
                    </Button>
                  </Stack>
                </Card>
              ) : null}
            </>
          )}
        </Stack>
      </FormDrawer>
    </Box>
  );
}

function RoleChip({ role }: { role: string }) {
  const normalizedRole = role.toUpperCase();

  if (normalizedRole === guestApprovalRole) {
    return <Chip size="small" label="Guest" color="info" />;
  }

  const isAdmin = normalizedRole === "ADMIN";
  return <Chip size="small" label={isAdmin ? "Admin" : "User"} color={isAdmin ? "primary" : "default"} />;
}

function ApprovalChip({ user }: { user: UserAccessRequest }) {
  if (user.approvalStatus === "Pending") {
    return <Chip size="small" label="Pending" color="warning" />;
  }

  if (user.approvalStatus === "Rejected") {
    return <Chip size="small" label="Rejected" color="error" />;
  }

  return <Chip size="small" label={user.isActive ? "Approved" : "Inactive"} color={user.isActive ? "success" : "default"} />;
}

function normalizeCategory(category?: string | null): ApprovalCategoryCode {
  return approvalCategories.find((option) => option.toLowerCase() === category?.toLowerCase()) ?? defaultApprovalCategory;
}

function labelRole(role: ApprovalRoleCode) {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "GUEST":
      return "Guest";
    default:
      return "User";
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatIdentityExpiry(value?: string | null) {
  return value ? formatDateTime(value) : "--";
}

function addDuration(value: Date, amount: number, unit: IdentityDurationUnit) {
  const next = new Date(value);
  if (unit === "hours") {
    next.setHours(next.getHours() + amount);
  } else {
    next.setDate(next.getDate() + amount);
  }
  return next;
}

function toLocalDateTimeInput(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function getApiMessage(error: unknown) {
  if (!axios.isAxiosError<{ message?: string }>(error)) {
    return null;
  }

  return error.response?.data?.message ?? null;
}

