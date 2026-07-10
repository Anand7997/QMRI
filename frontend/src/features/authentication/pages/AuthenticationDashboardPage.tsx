import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
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
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import DoneAllOutlinedIcon from "@mui/icons-material/DoneAllOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import LockClockOutlinedIcon from "@mui/icons-material/LockClockOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import SelectAllOutlinedIcon from "@mui/icons-material/SelectAllOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import { EmptyState, KpiTile, PageHeader, TableSkeleton } from "shared/components";
import {
  useApproveUser,
  useUsers,
  type ApprovalCategoryCode,
  type ApprovalRoleCode,
  type UserAccessRequest,
  type UserStatusFilter,
} from "shared/api/users";

type FilterTab = UserStatusFilter;

const filterTabs: { label: string; value: FilterTab }[] = [
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "All", value: "all" },
];

const defaultApprovalRole: ApprovalRoleCode = "USER";
const defaultApprovalCategory: ApprovalCategoryCode = "Fresher";

const approvalCategories: ApprovalCategoryCode[] = ["Fresher", "Digital", "Ai", "QE", "Delevery"];

export function AuthenticationDashboardPage() {
  const [filter, setFilter] = useState<FilterTab>("Pending");
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [roleByUserId, setRoleByUserId] = useState<Record<string, ApprovalRoleCode>>({});
  const [categoryByUserId, setCategoryByUserId] = useState<Record<string, ApprovalCategoryCode>>({});
  const { data: users = [], isLoading, isError } = useUsers("all");
  const approveUser = useApproveUser();

  const filteredUsers = useMemo(() => {
    return filter === "all" ? users : users.filter((user) => user.approvalStatus === filter);
  }, [filter, users]);

  const pendingFilteredUsers = filteredUsers.filter((user) => user.approvalStatus === "Pending");
  const pendingFilteredIds = pendingFilteredUsers.map((user) => user.userId);
  const selectedPendingIds = selectedIds.filter((id) => pendingFilteredIds.includes(id));
  const isAllPendingSelected = pendingFilteredIds.length > 0 && pendingFilteredIds.every((id) => selectedIds.includes(id));
  const isSomePendingSelected = selectedPendingIds.length > 0 && !isAllPendingSelected;

  const pendingCount = users.filter((user) => user.approvalStatus === "Pending").length;
  const approvedCount = users.filter((user) => user.approvalStatus === "Approved").length;
  const adminRequestCount = users.filter((user) => user.requestedRoleCode.toUpperCase() === "ADMIN").length;
  const activeUserCount = users.filter((user) => user.isActive).length;

  function approvalRoleFor(userId: string) {
    return roleByUserId[userId] ?? defaultApprovalRole;
  }

  function approvalCategoryFor(user: UserAccessRequest) {
    return categoryByUserId[user.userId] ?? normalizeCategory(user.category);
  }

  function handleToggleUser(userId: string) {
    setSelectedIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  }

  function handleToggleAllPending() {
    setSelectedIds((current) => {
      if (isAllPendingSelected) {
        return current.filter((id) => !pendingFilteredIds.includes(id));
      }

      return Array.from(new Set([...current, ...pendingFilteredIds]));
    });
  }

  function handleSelectAllPending() {
    setSelectedIds((current) => Array.from(new Set([...current, ...pendingFilteredIds])));
  }


  function handleRoleChange(userId: string, event: SelectChangeEvent<ApprovalRoleCode>) {
    setRoleByUserId((current) => ({ ...current, [userId]: event.target.value as ApprovalRoleCode }));
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
        roleCode: approvalRoleFor(userId),
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
          roleCode: approvalRoleFor(userId),
          category: user ? approvalCategoryFor(user) : defaultApprovalCategory,
        });
      }
      setSelectedIds((current) => current.filter((id) => !selectedPendingIds.includes(id)));
    } finally {
      setApprovingUserId(null);
    }
  }

  return (
    <Box>
      <PageHeader
        title="Authentication"
        subtitle="Approve signup requests before users can access their dashboards."
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
              disabled={pendingFilteredIds.length === 0 || approveUser.isPending}
              onClick={handleSelectAllPending}
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
            <Tabs value={filter} onChange={(_, value: FilterTab) => setFilter(value)}>
              {filterTabs.map((tab) => (
                <Tab key={tab.value} label={tab.label} value={tab.value} sx={{ cursor: "pointer" }} />
              ))}
            </Tabs>
          </Stack>
        </Stack>

        {approveUser.isError ? <Alert severity="error" sx={{ mx: 2.5, mt: 2 }}>Unable to approve one or more users.</Alert> : null}
        {isError ? <Alert severity="error" sx={{ mx: 2.5, mt: 2 }}>Unable to load authentication requests.</Alert> : null}

        {isLoading ? (
          <TableSkeleton rows={6} cols={8} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={<PersonAddAltOutlinedIcon sx={{ fontSize: 40 }} />}
            title={filter === "Pending" ? "No pending requests" : "No accounts found"}
            description={filter === "Pending" ? "New signup requests will appear here for approval." : "Try a different filter."}
          />
        ) : (
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Table sx={{ minWidth: 1180 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isAllPendingSelected}
                      indeterminate={isSomePendingSelected}
                      disabled={pendingFilteredIds.length === 0}
                      onChange={handleToggleAllPending}
                      inputProps={{ "aria-label": "Select all pending requests" }}
                    />
                  </TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Requested role</TableCell>
                  <TableCell>Approve as</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => {
                  const isPending = user.approvalStatus === "Pending";
                  const selectedRole = approvalRoleFor(user.userId);
                  const selectedCategory = approvalCategoryFor(user);

                  return (
                    <TableRow key={user.userId} hover selected={selectedIds.includes(user.userId)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(user.userId)}
                          disabled={!isPending || approveUser.isPending}
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
                        {isPending ? (
                          <FormControl size="small" sx={{ minWidth: 112 }}>
                            <Select value={selectedRole} onChange={(event) => handleRoleChange(user.userId, event)}>
                              <MenuItem value="USER">User</MenuItem>
                              <MenuItem value="ADMIN">Admin</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <RoleChip role={user.roles.includes("ADMIN") ? "ADMIN" : user.requestedRoleCode} />
                        )}
                      </TableCell>
                      <TableCell>
                        {isPending ? (
                          <FormControl size="small" sx={{ minWidth: 132 }}>
                            <Select value={selectedCategory} onChange={(event) => handleCategoryChange(user.userId, event)}>
                              {approvalCategories.map((category) => (
                                <MenuItem key={category} value={category}>
                                  {category}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <CategoryChip category={selectedCategory} />
                        )}
                      </TableCell>
                      <TableCell>
                        <ApprovalChip user={user} />
                      </TableCell>
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
                            Accept as {selectedRole === "ADMIN" ? "Admin" : "User"}
                          </Button>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {user.approvedAtUtc ? `Approved ${formatDate(user.approvedAtUtc)}` : "Approved"}
                          </Typography>
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
    </Box>
  );
}

function RoleChip({ role }: { role: string }) {
  const isAdmin = role.toUpperCase() === "ADMIN";
  return <Chip size="small" label={isAdmin ? "Admin" : "User"} color={isAdmin ? "primary" : "default"} />;
}

function CategoryChip({ category }: { category: string }) {
  return <Chip size="small" label={normalizeCategory(category)} variant="outlined" />;
}

function normalizeCategory(category?: string | null): ApprovalCategoryCode {
  return approvalCategories.find((option) => option.toLowerCase() === category?.toLowerCase()) ?? defaultApprovalCategory;
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}



